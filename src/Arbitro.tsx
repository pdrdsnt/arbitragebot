import { PoolData, Trade } from "./types";
import "./App.css"
import InputNumber from "./InputNumber";
import { useState } from "react";
export default function Arbitro({ pools }: { pools: Array<PoolData> }) {
    
    const [amount,setAmount] = useState("100")
    class TknDirInPool{
        pool: PoolData;
        dir: boolean;
        constructor(
            pool: PoolData,
            dir: boolean
        )
        {
            this.pool = pool
            this.dir = dir
        }
    }

    const poolsbyTokens = pools.reduce<Record<string, Array<TknDirInPool>>>((acc, pool) => {
        // Adiciona os dados ao acumulador
        if (!(pool.token0.address in acc)) acc[pool.token0.address] = [];
        if (!(pool.token1.address in acc)) acc[pool.token1.address] = [];
        acc[pool.token0.address].push(new TknDirInPool(pool,true));
        acc[pool.token1.address].push(new TknDirInPool(pool,false));
        return acc; // Retorna o acumulador para a próxima iteração
    }, {});
    const tokens: string[] = Object.keys(poolsbyTokens)
    let target = "";
    let current = "";
    for (const token_adrress of tokens) {
        const checked_tokens: string[] = []
        checked_tokens.push(token_adrress)
        for(const t of tokens)target = !checked_tokens.includes(t) ? t : ""
        checked_tokens.push(target)
        if(current == "")continue
        const token_pools = poolsbyTokens[token_adrress]
        getAllTrades(token_adrress,token_pools)
    }

    function getAllTrades(tkn: string,token_pools: Array<TknDirInPool>){
        for (const pool of token_pools) {
            const dir = pool.dir ? pool.pool.token0.address : pool.pool.token1.address
            if (dir != target) continue;
            if (pool.pool.token1.address != target)continue;
            const trade = new Trade(pool.pool,pool.dir)
            
        }
    }

    return (
        <div className="floating-bar">
            <div className="token-container">
                <h2>ARBITRO</h2>
                <InputNumber set_value={setAmount} value={amount}/>
            </div>
            {pools.map((c) => (
                <div>{c.dex} {"--->"}</div>
            ))}
        </div>
    )
}