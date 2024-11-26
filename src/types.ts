import { ethers } from "ethers";


export type Chain = {
    bsc : ChainData;
};


export type ChainData = {
    dexes: Exchanges;
    tokens: Tokens;
    abis: any;
    providers: Array<ethers.JsonRpcProvider>
    signers: Array<ethers.ContractRunner>
};

export type Tokens = {
    [key: string]: TokenData
};

export type Exchanges = {
    [key: string]: ExchangeData
};

export type ExchangeData = {
    v2?: ExchangeVersion; // Optional `v2` key
    v3?: ExchangeVersion; // Optional `v3` key
};

export type TokenData = {
    name: string;
    icon: string | null;
    decimals: number;
    contract: ethers.Contract | null;
}

export type ExchangeVersion = {
    factory: string
    contract: ethers.Contract | null;
    pools: Pools;
};

export type Pools = {
    [key: string]: PoolData
};

export class PoolData {
    contract: ethers.Contract;
    dex: string;
    version: string;
    address: string;
    token0: string;
    token1: string;
    volume: string
    price: number;
    fee: number;
    constructor(
        contract: ethers.Contract,
        dex: string,
        version: string,
        address: string,
        token0: string,
        token1: string,
        volume = "",
        price = 0,
        fee = 0,
    ){
        this.contract = contract;
        this.dex = dex;
        this.version = version;
        this.address = address;
        this.token0 = token0;
        this.token1 = token1;
        this.volume = volume;
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
