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
const { MNEMONIC, PRIVATE_KEY, ALCHEMY_API_KEY } = process.env;

const DEFAULT_MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PRIVATE_KEY) {
  sharedNetworkConfig.accounts = [PRIVATE_KEY];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
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
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}?blockNumber=16969691`,
        // blockNumber: 16969691,
        enabled: true,
      },
      accounts: [
        {
          privateKey: PRIVATE_KEY!,
          balance: utils.parseEther('10000').toString(),
        },
      ],
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 1,
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
      mainnet: process.env.ETHER_SCAN_API_KEY!,
    },
  },
  typechain: {
    outDir: 'build/types',
    target: 'ethers-v5',
  },
};

export default config;
