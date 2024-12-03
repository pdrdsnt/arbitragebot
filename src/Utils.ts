import { PoolData, TokenData } from "./types";
import { BigNumber } from "bignumber.js"
import { ctx } from './App';
import { useContext } from "react";
import { ethers } from "ethers";

export function GetAdrressesByUniqueId(name: string): Array<string> {
    return name.split("-");
}
export function GetNamesByUniqueId(name: string, div: string = ""): Array<string> {
    const arr: Array<string> = name.split("-").map((s) => useContext(ctx).tokens[s].name);
    arr[0] += div;
    return arr;
}
export function selectItemInList(pairId: string, list: Array<string>): Array<string> {
    if (list.includes(pairId)) {
        return list.filter(pair => pair != pairId)
    } else {
        return [...list, pairId]
    }
}
export function PairUniqueId(addr0: string, addr1: string): string {
    const sortedTokens = [addr0, addr1].sort();
    return sortedTokens.join("-");
}
export function GetAllPairs(tokens: Array<string>): Array<string> {
    let pairs = [];
    const total_tokens = tokens.length;

    for (let i = 0; i < total_tokens - 1; i++) {
        for (let j = i + 1; j < total_tokens; j++) {
            const pair = [tokens[i], tokens[j]];
            pairs.push(PairUniqueId(pair[0], pair[1]));
        }
    }
    return pairs;
}
export async function UpdateV3Data(poolContract: ethers.Contract,pool_data: PoolData): Promise<PoolData> {
    const tokens: Array<TokenData> = [pool_data.token0,pool_data.token1]
    const slot0 = await poolContract.slot0();
    
    const price = BigNumber(
        decodeSqrtPriceX96Big(slot0[0] as bigint, tokens)
        )
    
    const volume = await poolContract.liquidity();
    pool_data.price = price;
    pool_data.volume = volume.toString()

    return pool_data;
}

export async function UpdateV2Data(poolContract: ethers.Contract,pool_data: PoolData): Promise<PoolData> {
    
    const reserves: [bigint, bigint] = await poolContract.getReserves();
    const new_reserves = [reserves[0] + 1n, reserves[1] - 1n]
    
    const new_price = decodeSimplePrice(
        new_reserves,
        [pool_data.token0,pool_data.token1]
    )

    const price = decodeSimplePrice(
        reserves,
        [pool_data.token0,pool_data.token1]
    )

    console.log("price" + price.toString())
    console.log("nprice" + new_price.toString())
    const price_impact_big_number = price.minus(new_price)
    console.log("dddddddddddd" + price_impact_big_number.toString())
    pool_data.price_impact = price_impact_big_number

    pool_data.volume = BigNumber((reserves[1] + reserves[0]).toString());
    pool_data.price = price

    return pool_data;
}

function decodeSimplePrice(
    reserves: bigint[],
    tokens: Array<TokenData>
): BigNumber {

    const decimals = tokens.map((r) => r.decimals)

    if (reserves.length < 2) throw new Error("Insufficient reserves provided.");
    if (!decimals[0] || !decimals[1])
        throw new Error("Invalid token decimals provided.");
  
    const reserve0 = new BigNumber(reserves[0].toString());
    const reserve1 = new BigNumber(reserves[1].toString());

    if (reserve0.isZero()) throw new Error("Division by zero in reserves.");

    const priceBigNumber = reserve1.div(reserve0);
    const decimals_diff = decimals[0] - decimals[1];
    const decimals_scale = new BigNumber(10).pow(decimals_diff);
    const adjustedPrice = priceBigNumber.multipliedBy(decimals_scale);

    return adjustedPrice.decimalPlaces(18); // Adjust to desired precision
}

function decodeSqrtPriceX96Big(
    sqrtPriceX96: bigint,
    tokens: Array<TokenData>
): BigNumber {
    if (!tokens[0].decimals || !tokens[1].decimals)
        throw new Error("Invalid token decimals provided.");

    const Q96 = new BigNumber(2).pow(96);
    const sqrtPrice = new BigNumber(sqrtPriceX96.toString()).div(Q96);

    const price = sqrtPrice.pow(2);
    const decimals_diff = tokens[0].decimals - tokens[1].decimals;
    const decimals_scale = new BigNumber(10).pow(decimals_diff);

    return price.multipliedBy(decimals_scale).decimalPlaces(18); // Adjust to desired precision
}
/*
export async function getNearestInitializedTicks(poolData: PoolData) {
    // Calculate the word position and bit position
    const wordPosition = Math.floor(poolData.tick / 2 ** 8);
    const bitPosition = Math.floor((poolData.tick % 2 ** 8) / 10);

    // Fetch the tick bitmap
    const tickBitmap = await poolData.contract.tickBitmap(wordPosition);

    // Check current tick initialization
    if ((tickBitmap & (1 << bitPosition)) !== 0) {
        const tickData = await poolData.contract.ticks(poolData.tick);
        return { tick: poolData.tick, tickData };
    }

    // Scan for nearest initialized ticks
    let searchUp = poolData.tick;
    let searchDown = poolData.tick;
    while (true) {
        searchUp += 10;
        searchDown -= 10;

        try {
            const tickDataUp = await poolData.contract.ticks(searchUp);
            return { tick: searchUp, tickData: tickDataUp };
        } catch {}

        try {
            const tickDataDown = await poolData.contract.ticks(searchDown);
            return { tick: searchDown, tickData: tickDataDown };
        } catch {}
    }
}
*/
export async function getTickData(poolData: PoolData, currentTick: number) {
    const wordPosition = Math.floor(currentTick / 256);  // Which bitmap word contains the tick
    const bitPosition = currentTick % 256;  // Which bit represents the tick in that word

    // Fetch the tickBitmap for the word containing the currentTick
    const tickBitmap = await poolData.contract.tickBitmap(wordPosition);

    // Check if the tick is initialized
    if ((tickBitmap & (1 << bitPosition)) === 0) {
        throw new Error(`Tick ${currentTick} is uninitialized.`);
    }

    // If initialized, retrieve the tick data
    const tickData = await poolData.contract.ticks(currentTick);
    return tickData;
}