import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import logger from './logger.js';
import fs from 'fs';
import readline from 'readline';


class Wallet {
  constructor() {

    this.privateKey = generatePrivateKey();

    this.account = privateKeyToAccount(this.privateKey);
  }


  getInfo() {
    return {
      privateKey: this.privateKey,
      address: this.account.address,
      publicKey: this.account.publicKey,
    };
  }
}


async function createWallets(count) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const wallet = new Wallet();
    wallets.push(wallet.getInfo());
    logger.info(` ví ${i + 1} Đã tạo thành công: ${wallet.getInfo().address}`); 
  }


  const configContent = `// config.js\nexport const accounts = ${JSON.stringify(wallets, null, 2)};`;

  await saveToFile('config.js', configContent);
}

function saveToFile(filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) {
        logger.error(`giữ ${filename} Đã xảy ra lỗi: ${err.message}`); 
        reject(err);
      } else {
        logger.info(`${filename}Đã lưu thành công`); 
        resolve();
      }
    });
  });
}


async function getUserInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Vui lòng nhập số lượng ví cần tạo: ', (answer) => {
      rl.close();
      resolve(parseInt(answer, 10)); 
    });
  });
}


(async () => {
  const numberOfWallets = await getUserInput(); 
  if (isNaN(numberOfWallets) || numberOfWallets <= 0) {
    console.error('Vui lòng nhập số nguyên dương hợp lệ làm số lượng ví。');
    return;
  }
  await createWallets(numberOfWallets);
})();
