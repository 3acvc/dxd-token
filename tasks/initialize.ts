import { LedgerSigner } from '@anders-t/ethers-ledger';

import { task, types } from 'hardhat/config';
import { initializeDATContract } from './utils';

task('initialize', 'Initialize DAT contract')
  .addOptionalParam('ledger', 'Use a Ledger hardware wallet', false, types.boolean)
  .addParam('dat', 'DAT address', undefined, types.string, false)
  .setAction(async function (taskArgs, { ethers }) {
    let [deployer] = await ethers.getSigners();

    if (taskArgs.ledger === true) {
      deployer = new LedgerSigner(ethers.provider) as any;
    }

    const deployerAddress = await deployer.getAddress();

    if (!deployerAddress) {
      throw new Error('No deployer');
    }

    const tx = await initializeDATContract(ethers, deployer, taskArgs.dat);
    console.log(`DAT initialized tx hash: ${tx.transactionHash}`);
  });
