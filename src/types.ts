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
        address: string,
        token0: string,
        token1: string,
        volume0: number,
        volume1: number,
        price: number,
        fee: number
    ){
        this.pair_contract = pair_contract;
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

    constructor(dex: string,version: string, id: string){
        this.dex = dex;
        this.version = version;
        this.id = id;
    }
}
