// MIT License
// Copyright (c) 2021 Dũng Trần a.k.a Chiro Hiro <chiro8x@gmail.com>

import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import hre from 'hardhat';

interface IKeyValues {
  [key: string]: string;
}

interface ISignerCache {
  [key: string]: Signer;
}

const signers: ISignerCache = {};

const signerAlias: IKeyValues = {
};

export async function unlockSigner(alias: string): Promise<Signer>;

export async function unlockSigner(alias: string, address: string): Promise<Signer>;

export async function unlockSigner(...params: string[]): Promise<Signer> {
  if (params.length === 1) {
    const [alias] = params;
    if (typeof alias !== 'string') throw new Error('Alias was not a string');
    if (typeof signerAlias[alias] === 'undefined') throw new Error('Alias was not defined');
    if (typeof signers[signerAlias[alias]] === 'undefined') throw new Error('Signer was not unblocked');
    // We will get unlocked signer by alias
    return signers[signerAlias[alias]];
  } else if (params.length === 2) {
    const [alias, address] = params;
    // Prevent case sensitive
    const key = address.toLowerCase();
    if (typeof signers[address] === 'undefined') {
      if (typeof signerAlias[alias] === 'undefined') {
        signerAlias[alias] = key;
      }
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
      });
      signers[address] = await hre.ethers.provider.getSigner(address);
    }
    return signers[address];
  }
  throw new Error('Number of parameters was not match');
}
