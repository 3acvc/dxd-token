import { AddressZero, MaxUint256 } from '@ethersproject/constants';
import chai from 'chai';
import { ethers } from 'hardhat';
import { unlockSigner } from './unlock-signer';

const { expect } = chai;

const AVATAR_ADDRESS = '0x519b70055af55A007110B4Ff99b0eA33071c720a';
const DXDAO_PROXY_ADMIN = '0x07eD323e96b5b37f49432CE86277A56015e7FB5e';
const DAT_PROXY = '0xa1d65E8fB6e87b60FECCBc582F7f97804B725521';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const DXDAO_CLOSURE_SAFE = '0x4942fbdc53B295563d59Af51e6DDEdceba5E332f';

const DLABS_VESTING_CONTRACT = '0x293b2efbbf97a1ceea2b479a4d026cbc1e918769';
const DLABS_VESTING_BENEFICIARY = '0x8E900Cf9BD655e34bb610f0Ef365D8d476fD7337';

describe('DXD upgrade and Withdrwals', function () {
  let avatarSigner: Awaited<ReturnType<typeof unlockSigner>>;
  let dxdaoClosureSafeSigner: Awaited<ReturnType<typeof unlockSigner>>;

  before(async function () {
    avatarSigner = await unlockSigner('avatar', AVATAR_ADDRESS);
    // Fund the dxd closure safe with some ETH
    const [deployer] = await ethers.getSigners();
    await deployer
      .sendTransaction({
        to: AVATAR_ADDRESS,
        value: ethers.utils.parseEther('100'),
      })
      .then((tx) => tx.wait());
  });

  it('Upgrade DAT implementation correctly', async function () {
    const dat = await ethers.getContractAt('DecentralizedAutonomousTrust', DAT_PROXY, avatarSigner);

    // Get the state of the DAT before the upgrade
    const stateBeforeUpgrade = {
      totalSupply: (await dat.totalSupply()).toString(),
      beneficiary: await dat.beneficiary(),
      control: await dat.control(),
      name: await dat.name(),
      symbol: await dat.symbol(),
      decimals: await dat.decimals(),
      // Config
      feeBasisPoints: (await dat.feeBasisPoints()).toString(),
      autoBurn: await dat.autoBurn(),
      revenueCommitmentBasisPoints: (await dat.revenueCommitmentBasisPoints()).toString(),
      minInvestment: (await dat.minInvestment()).toString(),
      openUntilAtLeast: (await dat.openUntilAtLeast()).toString(),
    };

    // Get the proxy admin from the avatar
    const dxdaoProxyAdmin = await ethers.getContractAt('ProxyAdmin', DXDAO_PROXY_ADMIN, avatarSigner);

    // Deploy the new implementation
    const DecentralizedAutonomousTrust = await ethers.getContractFactory('DecentralizedAutonomousTrust');
    const nextDATImpl = await DecentralizedAutonomousTrust.deploy();
    await nextDATImpl.deployed();

    // Upgrade the proxy
    await dxdaoProxyAdmin.upgrade(DAT_PROXY, nextDATImpl.address).then((tx) => tx.wait());

    // Verify the implementation is the new one
    expect(await dxdaoProxyAdmin.getProxyImplementation(DAT_PROXY)).to.equal(nextDATImpl.address);

    // Get the new DAT
    const nextDat = await ethers.getContractAt('DecentralizedAutonomousTrust', DAT_PROXY, avatarSigner);

    // Get the state of the DAT after the upgrade
    const stateAfterUpgrade = {
      totalSupply: (await nextDat.totalSupply()).toString(),
      beneficiary: await nextDat.beneficiary(),
      control: await nextDat.control(),
      name: await nextDat.name(),
      symbol: await nextDat.symbol(),
      decimals: await nextDat.decimals(),
      // Boding curve config
      feeBasisPoints: (await nextDat.feeBasisPoints()).toString(),
      autoBurn: await nextDat.autoBurn(),
      revenueCommitmentBasisPoints: (await nextDat.revenueCommitmentBasisPoints()).toString(),
      minInvestment: (await nextDat.minInvestment()).toString(),
      openUntilAtLeast: (await nextDat.openUntilAtLeast()).toString(),
    };

    // Compare the state before and after the upgrade
    expect(stateBeforeUpgrade).to.deep.equal(stateAfterUpgrade);
  });

  it.skip('Transfer the DAT control to the closure safe', async function () {
    const nextDat = await ethers.getContractAt('DecentralizedAutonomousTrust', DAT_PROXY, avatarSigner);

    // At this point, the avatar is both beneficiary and control of the DAT
    // We need to transfer the control to the DXdao Clousure Safe
    await nextDat
      .updateConfig(
        AddressZero,
        DXDAO_CLOSURE_SAFE,
        DXDAO_CLOSURE_SAFE,
        DXDAO_CLOSURE_SAFE,
        await nextDat.feeBasisPoints(), // keep the same
        await nextDat.autoBurn(), // keep the same
        await nextDat.revenueCommitmentBasisPoints(), // keep the same
        await nextDat.minInvestment(), // keep the same
        await nextDat.openUntilAtLeast() // keep the same
      )
      .then((tx) => tx.wait());

    // Verify the control and beneficiary are now the DXdao Clousure Safe
    expect(await nextDat.control()).to.equal(DXDAO_CLOSURE_SAFE);
    expect(await nextDat.beneficiary()).to.equal(DXDAO_CLOSURE_SAFE);
  });

  it('Withdraw the USDC and ETH back to the avatar', async function () {
    const datProxyFromClosureSafe = await ethers.getContractAt(
      'DecentralizedAutonomousTrust',
      DAT_PROXY,
      dxdaoClosureSafeSigner
    );

    const usdc = await ethers.getContractAt('IERC20', USDC_ADDRESS, dxdaoClosureSafeSigner);

    // Get the ETH and USDC balance of the closure safe
    const avatarBalance = {
      eth: await ethers.provider.getBalance(AVATAR_ADDRESS),
      usdc: await usdc.balanceOf(AVATAR_ADDRESS),
    };
    // Get the ETH and USDC balance of the DXDProxy
    const dxdProxyBalance = {
      eth: await ethers.provider.getBalance(DAT_PROXY),
      usdc: await usdc.balanceOf(DAT_PROXY),
    };

    // Transfer ETH and USDC to the the beneficiary: DXdao Clousure Safe
    await datProxyFromClosureSafe
      .withdrawETH({
        gasLimit: 1000000, // 1M gas
      })
      .then((tx) => tx.wait());
    await datProxyFromClosureSafe.withdrawToken(USDC_ADDRESS).then((tx) => tx.wait());

    // // Verify that the DXDProxy is empty now
    // expect(await ethers.provider.getBalance(DAT_PROXY)).to.equal(0);
    expect(await usdc.balanceOf(DAT_PROXY)).to.equal(0);

    // Verify that the DXdao Clousure Safe has the ETH and USDC
    expect(await ethers.provider.getBalance(AVATAR_ADDRESS)).to.equal(avatarBalance.eth.add(dxdProxyBalance.eth));
    expect(await usdc.balanceOf(AVATAR_ADDRESS)).to.equal(avatarBalance.usdc.add(dxdProxyBalance.usdc));
  });

  it('Avatar can burn and mint DXD tokens from vesting contract', async function () {
    const datProxyFromAvatar = await ethers.getContractAt('DecentralizedAutonomousTrust', DAT_PROXY, avatarSigner);

    const vestingContractDXDBalance = await datProxyFromAvatar.balanceOf(DLABS_VESTING_CONTRACT);
    const vestingBeneficiaryDXDBalance = await datProxyFromAvatar.balanceOf(DLABS_VESTING_BENEFICIARY);

    // Final expected balance: initial balance + amount stuck in the vesting contract
    const beneficiaryFinalDXDBalance = vestingBeneficiaryDXDBalance.add(vestingContractDXDBalance);

    // Burn from vesting contracts
    await datProxyFromAvatar.burnFrom(DLABS_VESTING_CONTRACT, vestingContractDXDBalance).then((tx) => tx.wait());

    // Mint the same amount to the beneficiary
    await datProxyFromAvatar.mint(DLABS_VESTING_BENEFICIARY, vestingContractDXDBalance).then((tx) => tx.wait());

    // Vesting contract should be empty now
    expect(await datProxyFromAvatar.balanceOf(DLABS_VESTING_CONTRACT)).to.equal(0);

    // At the end, the beneficiary should have the initial DXD + the amount stuck in the vesting contract
    expect(await datProxyFromAvatar.balanceOf(DLABS_VESTING_BENEFICIARY)).to.equal(beneficiaryFinalDXDBalance);
  });
});
