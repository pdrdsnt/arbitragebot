import { PoolData, TokenData} from "./types";
import { BigNumber } from "bignumber.js"
import { ctx } from './App';
import { useContext } from "react";

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

export function decodeSimplePrice(reserves: bigint[],tokens: Array<TokenData>) : BigNumber{

    const reserve0 = new BigNumber(reserves[0].toString());
    const reserve1 = new BigNumber(reserves[1].toString());
    const priceBigNumber = reserve1.div(reserve0);
    const decimals_diff = tokens[0].decimals - tokens[1].decimals;
    const decimals_scale = BigNumber(10).pow(decimals_diff);
    const adjustedPrice = priceBigNumber.multipliedBy(decimals_scale);

    const roundedPrice = adjustedPrice.decimalPlaces(18); // Adjust to desired precision (e.g., 8 decimals)
    return roundedPrice;

}

export function decodeSqrtPriceX96Big(sqrtPriceX96: bigint, tokens: Array<TokenData>): BigNumber {
    const decimals_diff = tokens[0].decimals - tokens[1].decimals;
    const Q96 = BigNumber(2).pow(96); // 2^96

    const sqrtPrice = new BigNumber(sqrtPriceX96.toString()).div(Q96.toString());
    const price = sqrtPrice.pow(2);
    const decimals_scale = new BigNumber(10).pow(decimals_diff);
    // Final price with decimals adjustment
    const adjustedPrice = price.multipliedBy(decimals_scale);

    const roundedPrice = adjustedPrice.decimalPlaces(18); // Adjust to desired precision (e.g., 8 decimals)
    return roundedPrice;
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
export async function getTickData(poolData: PoolData,currentTick: number) {
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