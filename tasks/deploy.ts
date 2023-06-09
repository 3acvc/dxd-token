import { LedgerSigner } from '@anders-t/ethers-ledger';
import { task, types } from 'hardhat/config';
import { deployDATContract, initializeDATContract } from './utils';

task('deploy', 'Deploys contracts')
  .addOptionalParam('ledger', 'Use a Ledger hardware wallet', false, types.boolean)
  .setAction(async function (taskArgs, { ethers }) {
    let [deployer] = await ethers.getSigners();

    if (taskArgs.ledger === true) {
      deployer = new LedgerSigner(ethers.provider) as any;
    }

    const deployerAddress = await deployer.getAddress();

    if (!deployerAddress) {
      throw new Error('No deployer');
    }

    console.log('Deploying DAT from', await deployer.getAddress());

    const dat = await deployDATContract(ethers, deployer);
    console.log('DAT deployed to', dat.address);

    console.log('Initializing DAT');
    await initializeDATContract(ethers, deployer, dat.address);
    console.log('DAT initialized');
  });
