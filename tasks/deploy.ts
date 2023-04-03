import { LedgerSigner } from '@anders-t/ethers-ledger';
import { constants } from 'ethers';
import { task, types } from 'hardhat/config';

task('deploy', 'Deploys contracts')
  .addOptionalParam('ledger', 'Use a Ledger hardware wallet', false, types.boolean)
  .setAction(async function (taskArgs, { ethers }) {
    let [deployer] = await ethers.getSigners();

    console.log('Deploying DAT from', deployer.address);

    if (taskArgs.ledger) {
      deployer = new LedgerSigner(ethers.provider) as any;
    }

    const DAT = await ethers.getContractFactory('DecentralizedAutonomousTrust');
    const dat = await DAT.deploy();

    await dat.deployed();

    // Initialize the master copy
    const initializeTx = await dat['initialize(uint256,address,uint256,uint256,uint256,uint256,string,string)'](
      0,
      constants.AddressZero,
      1,
      1,
      1,
      1,
      'DAT',
      'DAT'
    );

    await initializeTx.wait();
    console.log('DAT deployed to', dat.address);
  });
