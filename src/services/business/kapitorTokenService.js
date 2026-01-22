const { ethers } = require('ethers');
const ERC20_ABI = require('../../utils/erc20.abi');

class KapitorTokenService {
  constructor() {
    this.decimals = Number(process.env.KPT_TOKEN_DECIMALS || 6);
    this.tokenAddress = process.env.KPT_TOKEN_ADDRESS;
    this.treasuryPrivateKey = process.env.KAPITOR_TREASURY_PK;
    this.provider = process.env.ETH_RPC_URL ? new ethers.JsonRpcProvider(process.env.ETH_RPC_URL) : null;
    this.mockMode = !this.provider || !this.tokenAddress || !this.treasuryPrivateKey;
  }

  getContract(signerOrProvider) {
    if (!this.tokenAddress) {
      throw new Error('KPT token address is not configured');
    }
    const targetProvider = signerOrProvider || this.provider;
    if (!targetProvider) {
      throw new Error('RPC provider not configured');
    }
    return new ethers.Contract(this.tokenAddress, ERC20_ABI, targetProvider);
  }

  getTreasuryWallet() {
    if (this.mockMode) {
      return null;
    }
    const signer = new ethers.Wallet(this.treasuryPrivateKey, this.provider);
    return signer;
  }

  toTokenUnits(amount) {
    return ethers.parseUnits(String(amount), this.decimals);
  }

  async mintTo(address, amount) {
    if (!address) {
      throw new Error('Mint target address is required');
    }
    if (!Number(amount)) {
      throw new Error('Mint amount must be greater than zero');
    }

    if (this.mockMode) {
      return {
        mock: true,
        txHash: null,
        amount,
      };
    }

    const signer = this.getTreasuryWallet();
    const contract = this.getContract(signer);
    const tx = await contract.mint(address, this.toTokenUnits(amount));
    const receipt = await tx.wait();
    return {
      mock: false,
      txHash: receipt.hash,
      amount,
    };
  }

  async getBalance(address) {
    if (!address) {
      throw new Error('Address is required');
    }
    if (this.mockMode) {
      return {
        raw: 0n,
        formatted: '0',
      };
    }
    const contract = this.getContract(this.provider);
    const balance = await contract.balanceOf(address);
    return {
      raw: balance,
      formatted: ethers.formatUnits(balance, this.decimals),
    };
  }

  async transferWithPrivateKey(privateKey, to, amount) {
    if (!privateKey) throw new Error('Private key is required');
    if (!to) throw new Error('Recipient address is required');

    if (this.mockMode) {
      return {
        mock: true,
        txHash: null,
      };
    }

    const wallet = new ethers.Wallet(privateKey, this.provider);
    const contract = this.getContract(wallet);
    const tx = await contract.transfer(to, this.toTokenUnits(amount));
    const receipt = await tx.wait();
    return {
      mock: false,
      txHash: receipt.hash,
    };
  }
}

module.exports = new KapitorTokenService();
