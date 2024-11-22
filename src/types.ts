import { ethers } from "ethers";


export type ChainData = {
    [key: string]: ExchangesData;
};

export type ExchangesData = {
    dexes: Exchange; 
};

export type Exchange = {
    [key: string]: ExchangeData
};

export type ExchangeData = {
    v2?: ExchangeVersion; // Optional `v2` key
    v3?: ExchangeVersion; // Optional `v3` key
};


export type ExchangeVersion = {
    factory: string
    contract: ethers.Contract | null;
    pools: Pools;
};

export type Pools = {
    [key: string]: any
};

export type PairData = {
    pair_contract: ethers.Contract;
    token0: string;
    token1: string;
    volume0: number;
    volume1: number;
    price: number
};


