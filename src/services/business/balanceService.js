const { ethers } = require('ethers');
const { walletDetailsRepo, fiatLedgerRepo, depositRequestRepo } = require('../../repos');
const kapitorTokenService = require('./kapitorTokenService');

class BalanceService {
  constructor() {
    this.provider = process.env.ETH_RPC_URL ? new ethers.JsonRpcProvider(process.env.ETH_RPC_URL) : null;
  }

  async getUserBalances(uid) {
    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const [fiatSummary, pendingDeposits, tokenBalance, ethBalance] = await Promise.all([
      fiatLedgerRepo.getBalanceSummary(uid),
      depositRequestRepo.findFiatPendingByUid(uid),
      kapitorTokenService.getBalance(wallet.walletAddress),
      this.getNativeBalance(wallet.walletAddress),
    ]);

    const pendingFiat = pendingDeposits
      .filter((d) => d.fiatStatus !== 'minted')
      .reduce((acc, curr) => acc + (curr.fiatAmount || 0), 0);

    return {
      fiat: {
        currency: 'INR',
        available: fiatSummary.available,
        pending: pendingFiat,
      },
      kpt: {
        symbol: 'KPT',
        available: tokenBalance.formatted,
        pending: '0',
        contract: process.env.KPT_TOKEN_ADDRESS,
      },
      native: {
        symbol: 'ETH',
        available: ethBalance,
        network: process.env.ETH_NETWORK,
      },
    };
  }

  async getNativeBalance(address) {
    if (!this.provider) {
      return '0';
    }
    const balanceWei = await this.provider.getBalance(address);
    return ethers.formatEther(balanceWei);
  }
}

module.exports = new BalanceService();
