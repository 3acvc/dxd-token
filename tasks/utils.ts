import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Signer, constants } from 'ethers';
import { HardhatEthersHelpers } from 'hardhat/types';

/**
 * Deploys a new DAT contract.
 * @param ethers ethers instance
 * @param signer signer
 * @returns
 */
export async function deployDATContract(ethers: HardhatEthersHelpers, signer: Signer | SignerWithAddress) {
  const DAT = await ethers.getContractFactory('DecentralizedAutonomousTrust', signer);
  const dat = await DAT.deploy();
  await dat.deployed();
  return dat;
}

/**
 * Initializes a DAT contract.
 * @param ethers ethers instance
 * @param signer signer
 * @param address address of the DAT contract
 * @returns
 */
export async function initializeDATContract(
  ethers: HardhatEthersHelpers,
  signer: Signer | SignerWithAddress,
  address: string
) {
  const dat = await ethers.getContractAt('DecentralizedAutonomousTrust', address, signer);

  // Initialize the master copy
  const initializeTx = await dat['initialize(uint256,address,uint256,uint256,uint256,uint256,string,string)'](
    0,
    constants.AddressZero,
    1,
    1,
    1,
    1,
    'DXdao',
    'DXD'
  );

  return initializeTx.wait(1);
}
