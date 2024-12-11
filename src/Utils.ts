import { PoolData } from "./types";
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
export async function UpdateV3Data(poolContract: ethers.Contract, pool_data: PoolData): Promise<PoolData> {
    const slot0 = await poolContract.slot0();

    const price = BigNumber(
        decodeSqrtPriceX96Big(slot0[0] as bigint)
    )

    const liquidity = await poolContract.liquidity();

    const [reserve0, reserve1] = calculateReservesFromLiquidity(
        liquidity,
        price,
        slot0.tick
    );
  
    pool_data.price = price;
    pool_data.reserves[price.toString()] = [reserve0,reserve1];

    return pool_data;
}
export async function UpdateV2Data(poolContract: ethers.Contract, pool_data: PoolData): Promise<PoolData> {

    const reserves: [bigint, bigint] = await poolContract.getReserves();

    const reserve0 = new BigNumber(reserves[0].toString());
    const reserve1 = new BigNumber(reserves[1].toString());
   
    const price = decodeSimplePrice(
        [reserve0, reserve1]
    )

    pool_data.reserves[price.toString()] = [reserve0,reserve1];
    pool_data.price = price
    
    return pool_data;
}

function calculateReservesFromLiquidity(
    liquidity: bigint,
    price: BigNumber,
    tick: number
): [BigNumber, BigNumber] {
    // Perform calculations to determine reserves based on liquidity and price
    // This would depend on the exact formula for Uniswap V3's reserve calculation
    // Placeholder implementation:

    const sqrtPrice = price.sqrt();
    const reserve0 = new BigNumber(liquidity.toString()).dividedBy(sqrtPrice);
    const reserve1 = new BigNumber(liquidity.toString()).multipliedBy(sqrtPrice);

    return [reserve0, reserve1];
}
function decodeSimplePrice(
    reserves: BigNumber[],
): BigNumber {

    const reserve0 = new BigNumber(reserves[0]);
    const reserve1 = new BigNumber(reserves[1]);

    if (reserve0.isZero()) throw new Error("Division by zero in reserves.");

    const priceBigNumber = reserve1.div(reserve0);
  
    return priceBigNumber;
}
function decodeSqrtPriceX96Big(
    sqrtPriceX96: bigint,
    ): BigNumber {

    const Q96 = new BigNumber(2).pow(96);
    const sqrtPrice = new BigNumber(sqrtPriceX96.toString()).div(Q96);

    const price = sqrtPrice.pow(2);

    return price; // Adjust to desired precision
}

export async function getNearestInitializedTicks(poolData: PoolData,tick: number) {
    // Calculate the word position and bit position
    const wordPosition = Math.floor(tick / 2 ** 8);
    const bitPosition = Math.floor((tick % 2 ** 8) / 10);

    // Fetch the tick bitmap
    const tickBitmap = await poolData.contract.tickBitmap(wordPosition);

    // Check current tick initialization
    if ((tickBitmap & (1 << bitPosition)) !== 0) {
        const tickData = await poolData.contract.ticks(tick);
        return { tick: tick, tickData };
    }

    // Scan for nearest initialized ticks
    let searchUp = tick;
    let searchDown = tick;
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
