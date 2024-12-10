import { PoolData, Trade, TradeRoute } from "./types";
import "./App.css"
import InputNumber from "./InputNumber";
import { useState } from "react";
export default function Arbitro({ pools }: { pools: Array<PoolData> }) {
    const [amount, setAmount] = useState("100");

    // to know what token each tokens is in pools, this only makes sense with poolsByToken
    class TknDirInPool {
        pool: PoolData;
        isToken0: boolean;
        constructor(pool: PoolData, dir: boolean) {
            this.pool = pool;
            this.isToken0 = dir;
        }
    }

    const poolsByToken = pools.reduce<Record<string, Array<TknDirInPool>>>((acc, pool) => {
        if (!(pool.token0.address in acc)) acc[pool.token0.address] = [];
        if (!(pool.token1.address in acc)) acc[pool.token1.address] = [];
        acc[pool.token0.address].push(new TknDirInPool(pool, true));
        acc[pool.token1.address].push(new TknDirInPool(pool, false));
        return acc;
    }, {});

    const tokens: string[] = Object.keys(poolsByToken);
    const checkedTokens: string[] = [];

    function Arbitro()
    {
        for (const tokenAddress of tokens) {
            if (checkedTokens.includes(tokenAddress)) continue;
            checkedTokens.push(tokenAddress);
            const tokenPools = poolsByToken[tokenAddress];
            getPathsOfToken(tokenAddress,tokenAddress,100)
        }
    }

    const getTknAddrFromDir = (poolDir: TknDirInPool) => {return poolDir.isToken0 ? poolDir.pool.token0.address : poolDir.pool.token1.address}
    const getOtherTknAddrFromDir = (poolDir: TknDirInPool) => {return poolDir.isToken0 ? poolDir.pool.token1.address : poolDir.pool.token0.address}
    

    function getPathsOfToken(origin: string, current: string,amount: number,path: TradeRoute = new TradeRoute,checked: string[] = []) : Record<string,TradeRoute> {
        if(origin == current){return path}
        if(checked.includes(current))return [];
        checked.push(current)

        const targets = poolsByToken[current].reduce<TknDirInPool[]>((acc,pool) => {
            acc.push(pool)
            return acc
        },[])

        const r: Trade[] = [];
        targets.forEach((t) => {
            
            const trade = new Trade(t.isToken0,t.pool,amount)

            path.concat(getPathsOfToken(origin,getOtherTknAddrFromDir(t),amount,path,checked))
        })

        return path;
    
    }

    return (
        <div className="floating-bar">
            <div className="token-container">
                <h2>ARBITRO</h2>
                <InputNumber set_value={setAmount} value={amount} />
            </div>
        </div>
    );
}
