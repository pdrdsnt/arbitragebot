import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { PromiseState } from "./PromiseState";


export type Chain = {
    bsc : ChainData;
};

export type ChainData = {
    dexes: Exchanges;
    tokens: Tokens;
    abis: any;
    providers: Array<ethers.WebSocketProvider>
    signers: Array<ethers.JsonRpcSigner>
    wallets: Array<ethers.BrowserProvider>
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
    address: string;
}

export type ExchangeVersion = {
    factory: string
    contract: ethers.Contract | null;
    pools: Pools;
};

export type Pools = {
    [key: string]: PoolData
};

export class TradeRoute{
    routes: Array<TradeRoute> = []
    trade?: Trade; //it stores the trade with parent
}

export class Trade{
    
    from0: boolean; 
    poolData: PoolData;
    amount: number
    
    constructor(
        from0: boolean,
        poolData: PoolData,
        amount = 1,
       
    ){
        this.from0 = from0;
        this.amount = amount;
        this.poolData = poolData;
    }
    
    Swap(): number 
    {
        let price = this.from0 ? this.poolData.price : BigNumber(1).div(this.poolData.price);
        
        let price_impact = 0
        
        
        return 0
    }
    
};

export class PoolPath {
    chain_id: number;
    dex: string;
    version: string;
    constructor(
        chain_id = 56,
        dex = "uniswap",
        version = "v2",
    ){
        this.chain_id = chain_id
        this.dex = dex
        this.version = version
    }
}


export class PoolData {
    tokens_id: string;
    contract: ethers.Contract;
    dex: string;
    version: string;
    address: string;
    token0: TokenData;
    token1: TokenData;
    reserves: Record<string,BigNumber[]>
    price: BigNumber;
    fee: number;
    decimals: Array<number>;
    constructor(
        tokens_id: string,
        contract: ethers.Contract,
        dex: string,
        version: string,
        address: string,
        token0: TokenData,
        token1: TokenData,
        fee: number, 
        decimals: Array<number>,
        reserves = {},
        price = BigNumber(0),
           
    ){
        this.tokens_id = tokens_id;
        this.contract = contract;
        this.dex = dex;
        this.version = version;
        this.address = address;
        this.token0 = token0;
        this.token1 = token1;
        this.reserves = reserves;
        this.price = price;
        this.fee = fee;
        this.decimals = decimals;
    }

};

export type RequestsStream<T> = {
    promiseStateArray: PromiseState<T>[]; 
    currentPoolRequest: number;
}