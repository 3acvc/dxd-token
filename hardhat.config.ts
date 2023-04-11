import { HardhatUserConfig } from 'hardhat/config';
import { HttpNetworkUserConfig } from 'hardhat/types';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import dotenv from 'dotenv';
import { utils } from 'ethers';

import './tasks';

// Load environment variables.
dotenv.config();
const { MNEMONIC, PRIVATE_KEY, ALCHEMY_API_KEY, ETHER_SCAN_API_KEY } = process.env;

const DEFAULT_PRIVATE_KEY = 'e41f686a80c3b013a7de09bcc1465674151ec9eec989b1d2d4884a819809372c';
const DEFAULT_MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

const privateKey = PRIVATE_KEY || DEFAULT_PRIVATE_KEY;
const mnemonic = MNEMONIC || DEFAULT_MNEMONIC;


let rpcURL = `https://eth.llamarpc.com`;
if (ALCHEMY_API_KEY) {
  rpcURL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;
}

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (privateKey.trim() !== '') {
  sharedNetworkConfig.accounts = [privateKey];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic,
  };
}

const config: HardhatUserConfig = {
  paths: {
    artifacts: 'build/artifacts',
    cache: 'build/cache',
    sources: 'contracts',
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      chainId: 1,
      forking: {
        url: `${rpcURL}/?blockNumber=16969691`,
        enabled: true,
      },
      accounts: [
        {
          privateKey,
          balance: utils.parseEther('10000').toString(),
        },
      ],
    },
    mainnet: {
      url: rpcURL,
      chainId: 1,
    },
    sepolia: {
      url: 'https://rpc.sepolia.org',
    },
  },
  solidity: {
    version: '0.5.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHER_SCAN_API_KEY!,
      sepolia: ETHER_SCAN_API_KEY!,
    },
  },
  typechain: {
    outDir: 'build/types',
    target: 'ethers-v5',
  },
};

export default config;
