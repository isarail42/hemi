import { http, createWalletClient, createPublicClient, parseEther, encodeFunctionData } from "viem";
import { hemiPublicBitcoinKitActions, hemiPublicOpNodeActions, hemiSepolia } from "hemi-viem";
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from "viem/chains";
import logger from './logger.js'; 
import hemiABI from './abi.js';
import WETHABI from './WETH.js';
import UNIABI from './uniswap.js';
import { accounts } from './config.js'; 

class EthereumClient {
  constructor(privateKey) {
    this.parameters = { chain: sepolia, transport: http() };
    this.account = privateKeyToAccount(privateKey);

    this.walletClient = createWalletClient({
      account: this.account,
      ...this.parameters
    });

    this.publicClient = createPublicClient({
      ...this.parameters,
    });
  }


  async depositETH(minGasLimit, extraData, amount) {
    const proxyContractAddress = '0xc94b1BEe63A3e101FE5F71C80F912b4F4b055925';
    const sendEth = parseEther(amount.toString());


    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`Số dư không đủ, vui lòng gửi đủ ETH trước, số dư${balance}`); 
      throw new Error('Invalid balance'); 
    }

    // 编码函数数据
    const data = encodeFunctionData({
      abi: hemiABI,
      functionName: 'depositETH',
      args: [minGasLimit, extraData]
    });

    try {
      // 发送交易
      const tx = await this.walletClient.sendTransaction({
        to: proxyContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaction sent: ${tx}`); 
    } catch (error) {
      logger.error(`Lỗi khi gửi giao dịch: ${error.message}`); 
      throw error; 
    }
  }
}


class HemiSepolia {
  constructor(privateKey) {

    this.parameters = { chain: hemiSepolia, transport: http() };
    this.account = privateKeyToAccount(privateKey);


    this.publicClient = createPublicClient(this.parameters)
      .extend(hemiPublicOpNodeActions())
      .extend(hemiPublicBitcoinKitActions());


    this.walletClient = createWalletClient({
      account: this.account,
      ...this.parameters
    });
  }

  // 交换 WETH 的方法
  async swapWeth() {
    const WethContractAddress = '0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A';
    const sendEth = parseEther('0.00001');

    // 查询余额
    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`Số dư không đủ, vui lòng gửi đủ ETH để trao đổi WETH trước`); 
      throw new Error('Insufficient balance for WETH swap'); 
    }

    const data = encodeFunctionData({
      abi: WETHABI,
      functionName: 'deposit',
    });

    try {
      // 发送交易
      const tx = await this.walletClient.sendTransaction({
        to: WethContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`WETH Transaction sent: ${tx}`); 
    } catch (error) {
      logger.error(`Lỗi trong quá trình trao đổi WETH: ${error.message}`); 
      throw error; 
    }
  }

  
  async swapDai() {
    const UniswapContractAddress = '0xA18019E62f266C2E17e33398448e4105324e0d0F';
    const sendEth = parseEther('0.00001');

    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`Số dư không đủ, vui lòng gửi đủ DAI để trao đổi trước`); 
      throw new Error('Insufficient balance for DAI swap'); 
    }

    const data = encodeFunctionData({
      abi: UNIABI,
      functionName: 'execute',
      args: [
        '0x0b00',
        [
          "0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a4000",
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000457fd60a0614bb5400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b0c8afd1b58aa2a5bad2414b861d8a7ff898edc3a000bb8ec46e0efb2ea8152da0327a5eb3ff9a43956f13e000000000000000000000000000000000000000000"
        ],

        Math.floor(Date.now() / 1000) + 60 * 20 + ''
      ]
    });

    try {

      const tx = await this.walletClient.sendTransaction({
        to: UniswapContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`DAI Transaction sent: ${tx}`); 
    } catch (error) {
      logger.error(`Lỗi trong quá trình trao đổi DAI:${error.message}`); 
      throw error; 
    }
  }
}


(async () => {
  for (const account of accounts) {
    const { privateKey } = account;


    let formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;

    try {

      const accountInfo = privateKeyToAccount(formattedPrivateKey);
    } catch (error) {
      logger.error(`Lỗi khi chuyển đổi tài khoản: ${error.message} (Privatekey: ${privateKey})`);
      continue; 
    }

    try {

      const ethClient = new EthereumClient(formattedPrivateKey);
      await ethClient.depositETH(200000, '0x', 0.1);
    } catch (error) {
      logger.error(`Đã xảy ra lỗi khi gửi tiền: ${error.message} (Privatekey: ${privateKey})`);
      continue; 
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {

      const hemiSepolia = new HemiSepolia(formattedPrivateKey);

      await hemiSepolia.swapWeth();

      await new Promise(resolve => setTimeout(resolve, 5000));

      await hemiSepolia.swapDai();
    } catch (error) {
      logger.error(`Đã xảy ra lỗi khi vận hành Hemi Sepolia: ${error.message} (Privatekey: ${privateKey})`);
    }
  }

})();
