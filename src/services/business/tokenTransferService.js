const bcrypt = require('bcrypt');
const { walletDetailsRepo, transactionRepo } = require('../../repos');
const { decrypt } = require('../../utils/crypto');
const kapitorTokenService = require('./kapitorTokenService');

class TokenTransferService {
  async send(uid, payload = {}) {
    const { password, to, amount } = payload;
    if (!uid) throw new Error('uid is required');
    if (!password || !to || !amount) {
      throw new Error('password, to and amount are required');
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.verified) {
      throw new Error('Mnemonic not verified');
    }

    const isValid = await bcrypt.compare(password, wallet.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const encrypted = JSON.parse(wallet.privateKey);
    const privateKey = decrypt(encrypted, password);

    const transferResult = await kapitorTokenService.transferWithPrivateKey(privateKey, to, amount);

    await transactionRepo.create({
      uid,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK || 'mainnet',
      txHash: transferResult.txHash,
      fromAddress: wallet.walletAddress,
      toAddress: to,
      assetType: 'token',
      tokenAddress: process.env.KPT_TOKEN_ADDRESS,
      symbol: 'KPT',
      decimals: kapitorTokenService.decimals,
      amount: String(amount),
      direction: 'out',
      type: 'transfer',
      status: transferResult.mock ? 'confirmed' : 'pending',
      context: 'kpt_transfer',
      rawTx: transferResult,
    });

    return {
      message: 'KPT transfer submitted',
      txHash: transferResult.txHash,
      mock: transferResult.mock,
    };
  }

  async receive(uid) {
    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      address: wallet.walletAddress,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK,
      token: {
        symbol: 'KPT',
        decimals: kapitorTokenService.decimals,
        contract: process.env.KPT_TOKEN_ADDRESS,
      },
    };
  }
}

module.exports = new TokenTransferService();
