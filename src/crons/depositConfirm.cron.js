const { ethers } = require("ethers");
const depositService = require("../services/business/depositRequestService");
const depositRepo = require("../repos/depositRequest");
const depositModel = require("../models/DepositRequest");

const CONFIRMATION_TARGET = Number(process.env.CONFIRMATION_TARGET || 6);

module.exports.runDepositConfirmationCron = async (provider) => {
    try {
        console.log("⏳ Cron: checking pending confirmations...");

        // 1️⃣ Get deposits still waiting for confirmations
        const pendingDeposits = await depositModel.find({
            status: "pending_confirmation",
            txHash: { $ne: null },
        });

        if (!pendingDeposits.length) {
            console.log("✔ No pending deposits");
            return;
        }

        const latestBlock = await provider.getBlockNumber();

        for (const deposit of pendingDeposits) {
            try {
                const receipt = await provider.getTransactionReceipt(deposit.txHash);

                // If tx not found / dropped
                if (!receipt) {
                    console.log(`❌ Tx missing: ${deposit.txHash}`);
                    continue;
                }

                const confirmations =
                    latestBlock - receipt.blockNumber + 1;

                // 2️⃣ Always update confirmations count
                await depositService.updateConfirmations(
                    deposit.txHash,
                    confirmations
                );

                // 3️⃣ Confirm when threshold reached
                if (confirmations >= CONFIRMATION_TARGET) {
                    await depositService.confirmDeposit(
                        deposit._id,
                        confirmations
                    );

                    console.log(
                        `✅ Deposit confirmed — tx: ${deposit.txHash} (${confirmations} confs)`
                    );
                } else {
                    console.log(
                        `⏳ Still confirming — tx: ${deposit.txHash} (${confirmations}/${CONFIRMATION_TARGET})`
                    );
                }
            } catch (err) {
                console.error("Cron tx error:", err.message);
            }
        }
    } catch (err) {
        console.error("Cron main error:", err.message);
    }
};
