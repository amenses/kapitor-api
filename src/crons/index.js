const cron = require("node-cron");
const { ethers } = require("ethers");
const { runDepositConfirmationCron } = require("./depositConfirm.cron");

const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTP_URL);

function startCronJobs() {
  // Runs every 30 seconds
  cron.schedule("*/30 * * * * *", async () => {
    console.log("⏲ Cron triggered: deposit confirmations check");
    await runDepositConfirmationCron(provider);
  });
}

module.exports = { startCronJobs };
