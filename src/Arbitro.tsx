import { PoolData, Trade, TradeRoute } from "./types";
import "./App.css"
import InputNumber from "./InputNumber";
import { useState } from "react";
import WalletButton from "./WalletButton";
export default function Arbitro({ pools }: { pools: Array<PoolData> }) {
    const [amount, setAmount] = useState("100");
    //console.log("pools received by Arbitro: " + pools.length)
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

    function Arbitro() {
        console.log("arbityo pools lenght: "+pools.length)
        for (const tokenAddress of tokens) {
            if (checkedTokens.includes(tokenAddress)) continue;
            checkedTokens.push(tokenAddress);
            return getPathsOfToken(tokenAddress, tokenAddress, 100, new TradeRoute())
        }
    }

    //const getTknAddrFromDir = (poolDir: TknDirInPool) => { return poolDir.isToken0 ? poolDir.pool.token0.address : poolDir.pool.token1.address }
    const getOtherTknAddrFromDir = (poolDir: TknDirInPool) => { return poolDir.isToken0 ? poolDir.pool.token1.address : poolDir.pool.token0.address }


    function getPathsOfToken(origin: string, current: string, amount: number, path: TradeRoute | null, checked: string[] = []): TradeRoute | null {
        if (origin == current) return path
        if (checked.includes(current)) return null;
        checked.push(current)

        const targets = poolsByToken[current].reduce<TknDirInPool[]>((acc, pool) => {
            acc.push(pool)
            return acc
        }, [])

        const new_route: TradeRoute = new TradeRoute()
        targets.forEach((t) => {
            const trade = new Trade(t.isToken0, t.pool, amount)
            const amountOut = trade.Swap();
            const route = getPathsOfToken(origin, getOtherTknAddrFromDir(t), amountOut, path, checked)
            if (route == null) return

            route.trade = trade;
            new_route.routes.push(route)
        })

        return new_route;
    }

    function extractPaths(route: TradeRoute): Array<Array<Trade>> {
        if (!route.trade) return []
        if (route.routes.length < 1) return [[route.trade]]
        const paths: Array<Array<Trade>> = []
        for (const i of route.routes) {
            const subpaths = extractPaths(i)
            for (const s of subpaths) {
                s.push(route.trade)
                paths.push([...s])
            }
        }
        return paths
    }

    const GetPaths = () => {
        const pairs = Arbitro()
        if (!pairs) return
        const paths = extractPaths(pairs)
        return paths
    }

    return (
        <div className="floating-bar">
            <div className="floating-bar-bar">
                <div>ARBITRO</div>
                <InputNumber set_value={setAmount} value={amount} />
                <WalletButton />
            </div>
            <div className="floating-bar-bar">
                {GetPaths()?.map((x) => x.map((_x) => {return (<div>_x.token0?_x.pool.token0.name:_x.pool.token1.name</div>)}))}
            </div>
        </div>
    );
}
