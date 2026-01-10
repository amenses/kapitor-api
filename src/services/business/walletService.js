const { walletDetailsRepo, transactionRepo } = require('../../repos');
const { encrypt, decrypt } = require('../../utils/crypto');
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);

class WalletService {
  /**
   * Create wallet for a user
   * @param {string} uid
   * @param {Object} payload { password, confirmPassword }
   */
  async create(uid, payload = {}) {
    const { password, confirmPassword } = payload;

    if (!uid) {
      throw new Error('uid is required');
    }

    if (!password || !confirmPassword) {
      throw new Error('password and confirmPassword are required');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Prevent duplicate wallet for uid
    const existing = await walletDetailsRepo.findByUid(uid);
    if (existing) {
      throw new Error('Wallet already exists for this user');
    }

    const wallet = ethers.Wallet.createRandom();

    const encryptedPrivateKey = encrypt(wallet.privateKey, password);
    const passwordHash = await bcrypt.hash(password, 10);

    const record = await walletDetailsRepo.create({
      uid,
      walletAddress: wallet.address,
      privateKey: JSON.stringify(encryptedPrivateKey),
      password: passwordHash,
      mnemonic: wallet.mnemonic.phrase.split(' '),
      verified: false,
    });

    return {
      message: 'Wallet created (save mnemonic securely)',
      uid: record.uid,
      mnemonic: wallet.mnemonic.phrase, // show once
    };
  }

  /**
   * Confirm mnemonic answers (answers is object with 1-based indices as keys)
   * @param {string} uid
   * @param {Object} answers
   */
  async confirmMnemonic(uid, answers) {
    if (!uid) throw new Error('uid is required');
    if (!answers || typeof answers !== 'object') throw new Error('answers are required');

    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) throw new Error('Wallet not found');

    const mn = wallet.mnemonic || [];

    let valid = true;
    for (const indexStr of Object.keys(answers)) {
      const idx = Number(indexStr);
      if (!Number.isInteger(idx) || idx < 1 || idx > mn.length) {
        valid = false;
        break;
      }
      const expected = mn[idx - 1];
      const provided = answers[indexStr];
      if (expected !== provided) {
        valid = false;
        break;
      }
    }

    if (!valid) throw new Error('Mnemonic verification failed');

    await walletDetailsRepo.updateByWalletAddress(wallet.walletAddress, { verified: true });

    return {
      message: 'Mnemonic verified successfully',
      address: wallet.walletAddress,
    };
  }

  /**
   * Unlock wallet (login)
   * @param {string} uid
   * @param {string} password
   */
  async unlock(uid, password) {
    if (!uid) throw new Error('uid is required');
    if (!password) throw new Error('password is required');

    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) throw new Error('Wallet not found');

    if (!wallet.verified) throw new Error('Mnemonic not verified');

    const isValid = await bcrypt.compare(password, wallet.password);
    if (!isValid) throw new Error('Invalid password');

    const encrypted = JSON.parse(wallet.privateKey);
    const privateKey = decrypt(encrypted, password);

    const w = new ethers.Wallet(privateKey);

    return {
      message: 'Wallet unlocked',
      address: w.address,
    };
  }

  async findByUid(uid) {
    return walletDetailsRepo.findByUid(uid);
  }

  async findByWalletAddress(address) {
    return walletDetailsRepo.findByWalletAddress(address);
  }
  /**
     * Get ETH balance of user's wallet
     * @param {string} uid
     * @returns {Promise<Object>}
     */
  async getBalance(uid) {
    if (!uid) {
      throw new Error('uid is required');
    }

    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balanceWei = await provider.getBalance(wallet.walletAddress);
    const balanceEth = ethers.formatEther(balanceWei);

    return {
      address: wallet.walletAddress,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK,
      balance: balanceEth,
      unit: 'ETH',
    };
  }

  /**
   * Send ETH from user's wallet
   * @param {string} uid
   * @param {Object} payload
   * @param {string} payload.password
   * @param {string} payload.to
   * @param {string} payload.amount (ETH)
   * @returns {Promise<Object>}
   */
  async sendCrypto(uid, payload = {}) {
    const { password, to, amount } = payload;

    if (!uid) {
      throw new Error('uid is required');
    }

    if (!password || !to || !amount) {
      throw new Error('password, to and amount are required');
    }

    const walletRecord = await walletDetailsRepo.findByUid(uid);
    if (!walletRecord) {
      throw new Error('Wallet not found');
    }

    if (!walletRecord.verified) {
      throw new Error('Mnemonic not verified');
    }

    const isValid = await bcrypt.compare(password, walletRecord.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const encrypted = JSON.parse(walletRecord.privateKey);
    const privateKey = decrypt(encrypted, password);

    const wallet = new ethers.Wallet(privateKey, provider);

    const txRequest = {
      to,
      value: ethers.parseEther(amount),
    };

    const gasLimit = await provider.estimateGas({
      ...txRequest,
      from: wallet.address,
    });

    const gasPrice = await provider.getGasPrice();

    const txResponse = await wallet.sendTransaction({
      ...txRequest,
      gasLimit,
      gasPrice,
    });

    await transactionRepo.create({
      uid,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK,
      txHash: txResponse.hash,
      fromAddress: wallet.address,
      toAddress: to,
      assetType: 'native',
      symbol: 'ETH',
      decimals: 18,
      amount,
      fee: ethers.formatEther(gasLimit * gasPrice),
      direction: 'out',
      type: 'transfer',
      status: 'pending',
      rawTx: txResponse,
    });

    return {
      message: 'Transaction submitted',
      txHash: txResponse.hash,
    };
  }

  /**
   * Get wallet address for receiving crypto
   * @param {string} uid
   * @returns {Promise<Object>}
   */
  async receiveCrypto(uid) {
    if (!uid) {
      throw new Error('uid is required');
    }

    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      address: wallet.walletAddress,
      chain: 'ethereum',
      network: process.env.ETH_NETWORK,
      message: 'Use this address to receive ETH',
    };
  }

  /**
 * Check EPT eligibility based on wallet balance
 * @param {string} uid
 * @returns {Promise<Object>}
 */
  async checkEPTEligibility(uid) {
    if (!uid) {
      throw new Error('uid is required');
    }

    const wallet = await walletDetailsRepo.findByUid(uid);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balanceWei = await provider.getBalance(wallet.walletAddress);
    const balance = Number(ethers.formatEther(balanceWei));

    const isEligible = balance >= 100000;

    return {
      address: wallet.walletAddress,
      balance,
      eligible: isEligible,
    };
  }

}


module.exports = new WalletService();
