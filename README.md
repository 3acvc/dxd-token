# DXD Token

Extends [DXtrust's DAT](https://github.com/levelkdev/dxtrust) implementation with the new methods:

- `withdrawETH` to withdraw ETH from the contract to the beneficiary.
- `withdrawToken(address token)` to withdraw any ERC20 token from the contract to the beneficiary.
- `burnFrom(address account, uint256 amount)` to burn the DXD tokens, callable only by the owner.

Tests cover the following scenarios:

- Upgrade the DXD Proxy contract to the new implementation.
- Withdraw ETH from the contract.
- Withdraw ERC20 token from the contract.
- Burn the DXD tokens in vesting contracts.

PS, this project uses Hardhat instead of Foundry. Forge requires Solidity >= 0.6.0, but the DXtrust's DAT was written in v0.5.17.