import { Tokens } from "./types";

export function GetAdrressesByUniqueId(name: string): Array<string> {
    return name.split("-");
}

export function GetNamesByUniqueId(name: string, names: Tokens, div: string = ""): Array<string> {
    const arr: Array<string> = name.split("-").map((s) => names[s].name);
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

export function GetAllPairs(tokens: Record<string, string>): Array<string> {
    let pairs = [];
    const total_tokens = Object.keys(tokens).length;
    const token_addresses = Object.keys(tokens);

    for (let i = 0; i < total_tokens - 1; i++) {
        for (let j = i + 1; j < total_tokens; j++) {
            const pair = [token_addresses[i], token_addresses[j]];
            pairs.push(PairUniqueId(pair[0], pair[1]));
        }
    }

    return pairs;
}

export function decodeSqrtPriceX96Big(sqrtPriceX96: BigInt) {
    const Q96 = BigInt(2) ** BigInt(96); // 2^96

    // Divide by Q96 to get the square root of the price
    const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);

    // Calculate prices
    const token1PerToken0 = Math.pow(sqrtPrice, 2); // (sqrtPrice)^2
    const token0PerToken1 = 1 / token1PerToken0; // Reciprocal of the price

    return token1PerToken0.toString();
}