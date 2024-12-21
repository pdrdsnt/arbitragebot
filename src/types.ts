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
    amountIn: BigNumber;
    amountOut: BigNumber;
    constructor(
        from0: boolean,
        poolData: PoolData,
        amount = BigNumber(1),
        amountOut = BigNumber('0')
       
    ){
        if(!amountOut.isEqualTo('0')){
            this.from0 = !from0;
            this.amountIn = amount;
            this.poolData = poolData;
            this.amountOut = this.Swap();
        }else{
            this.from0 = from0;
            this.amountIn = amount;
            this.poolData = poolData;
            this.amountOut = this.Swap();
        }
    }
     Swap(): BigNumber 
    {
        let price: BigNumber = this.from0 ? this.poolData.price : BigNumber('1').div(this.poolData.price);

        const fee = BigNumber(this.poolData.fee).div(10_000)

        const fee_amount = this.amountIn.times(fee);
        
        const v = this.amountIn.minus(fee_amount).times(price)

        return v;
    }

    FlashLoan(): BigNumber
    {
        let price: BigNumber = this.from0 ? this.poolData.price : BigNumber('1').div(this.poolData.price);

        const fee = BigNumber(this.poolData.fee).div(10_000)

        const fee_amount = this.amountIn.times(fee);
        
        const v = this.amountIn.minus(fee_amount).times(price)

        return v;
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