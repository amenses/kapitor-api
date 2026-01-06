// const { ethers } = require("ethers");
// const depositService = require("../services/business/depositRequestService");
// const ERC20_ABI = require("../utils/erc20.abi");
// const WalletModel = require("../models/WalletDetails"); // <- your custodial wallets

// const USDT_ADDRESS = process.env.USDT_ADDRESS;
// const CONFIRMATION_TARGET = Number(process.env.CONFIRMATION_TARGET || 6);

// let provider;
// let usdt;

// /**
//  * Reconnect-safe websocket provider
//  */
// function createProvider() {
//   console.log("WS URL:", process.env.RPC_WS_URL);

//   provider = new ethers.WebSocketProvider(process.env.RPC_WS_URL);

//   provider.on("error", (err) => {
//     console.log("⚠️ WS provider error:", err?.message || err);
//   });



//   usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

//   console.log("🚀 WebSocket provider connected");
// }



// /**
//  * Normalize USDT value (USDT = 6 decimals)
//  */
// async function normalizeAmount(raw) {
//   const decimals = 6;
//   return Number(raw) / 10 ** decimals;
// }

// /**
//  * Start listener
//  */
// async function startUSDTListener() {
//   createProvider();
// // subscribeTransfers();

//   console.log("🚀 USDT listener started…");


// //   usdt.on("Transfer", async (from, to, value, event) => {
// //     try {
// //         console.log("USDT Transfer event:", { from, to, value: value.toString(), event });
  
// //       // Only react if "to" is one of OUR custodial wallets
// //       const wallet = await WalletModel.findOne({ address: to.toLowerCase() });

// //       if (!wallet) return; // ignore non-app wallets

// //       const amount = await normalizeAmount(value);
// //       const txHash = event.log.transactionHash;

// //       console.log(`💰 Deposit detected`, {
// //         from,
// //         to,
// //         amount,
// //         txHash,
// //       });

// //       // Save/attach deposit
// //       const deposit = await depositService.recordBlockchainDeposit({
// //         walletAddress: to.toLowerCase(),
// //         txHash,
// //         amount,
// //       });

// //       // check confirmations immediately
// //       const receipt = await event.getTransactionReceipt();
// //       const current = await provider.getBlockNumber();
// //       const confirmations = current - receipt.blockNumber + 1;
// //       // Always update confirmations count
// // await depositService.updateConfirmations(txHash, confirmations);


// //       if (confirmations >= CONFIRMATION_TARGET) {
// //         await depositService.confirmDeposit(deposit._id, confirmations);
// //         console.log(`✅ Deposit confirmed (${confirmations})`);
// //       } else {
// //         console.log(
// //           `⏳ Waiting for confirmations (${confirmations}/${CONFIRMATION_TARGET})`
// //         );
// //       }
// //     } catch (err) {
// //       console.error("Listener error:", err);
// //     }
// //   });

// const filter = usdt.filters.Transfer(null, null);

// usdt.on(filter, async (payload) => {
//   try {
//     const from = payload.args[0];
//     const to   = payload.args[1];
//     const value = payload.args[2];

//     console.log("📡 FILTER EVENT", { from, to, value: value.toString() });

//     // Only react if "to" is one of OUR custodial wallets
//     const wallet = await WalletModel.findOne({
//       walletAddress: to,
//     });
//     console.log("Checking wallet:", to, wallet);
//     if (!wallet) {
//       console.log("⛔ Not our wallet, ignoring");
//       return;
//     }

//     const txHash = payload.log.transactionHash;

//     // please add a check for existing trxHash from db here also
//     const amount = Number(value) / 10 ** 6;


//         const deposit = await depositService.recordBlockchainDeposit({
//             uid: wallet.uid,
//         walletAddress: to.toLowerCase(),
//         txHash,
//         amount,
//         fromWallet: from.toLowerCase(),
//         });

//     // Confirmations check
//     const receipt = await provider.getTransactionReceipt(txHash);
//     const current = await provider.getBlockNumber();
//     const confirmations = current - receipt.blockNumber + 1;

//     await depositService.updateConfirmations(txHash, confirmations);

//     if (confirmations >= CONFIRMATION_TARGET) {
//       await depositService.confirmDeposit(deposit._id, confirmations);
//       console.log(`✅ Deposit confirmed (${confirmations})`);
//     } else {
//       console.log(
//         `⏳ Waiting for confirmations (${confirmations}/${CONFIRMATION_TARGET})`
//       );
//     }
//   } catch (err) {
//     console.error("Listener error:", err);
//   }
// });



// }

// module.exports = { startUSDTListener };
