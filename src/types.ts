import { ethers } from "ethers";

export type Chain = {
    bsc: ChainData;
};

export type ChainData = {
    dexes: Exchange;
    tokens: Record<string, string>;
    abis: any;
    providers: Array<string>
    signers: Array<string>
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
    [key: string]: PoolData
};

export default class PoolData {
    pair_contract: ethers.Contract;
    address: string;
    token0: string;
    token1: string;
    volume0: number;
    volume1: number;
    price: number;
    fee: number;

    constructor(
        pair_contract: ethers.Contract,
        address = "",
        token0 = "",
        token1 = "",
        volume0 = 0,
        volume1 = 0,
        price = 0,
        fee = 0
    ) {
        this.pair_contract = pair_contract,
        this.address = address;
        this.token0 = token0;
        this.token1 = token1;
        this.volume0 = volume0;
        this.volume1 = volume1;
        this.price = price;
        this.fee = fee;
    }

};


export class PairPath {
    dex: string;
    version: string;
    id: string;

    constructor(dex: string, version: string, id: string) {
        this.dex = dex;
        this.version = version;
        this.id = id;
    }
}
