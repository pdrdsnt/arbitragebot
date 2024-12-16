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

    function Arbitro() {
        
        for (const tokenAddress of tokens) {
            console.log("started for: " + tokenAddress)
            const r: TradeRoute = getTradeRoute(tokenAddress, tokenAddress, 100, null)
            return extractPaths(r)
        }
        
    }

    //const getTknAddrFromDir = (poolDir: TknDirInPool) => { return poolDir.isToken0 ? poolDir.pool.token0.address : poolDir.pool.token1.address }
    const getOtherTknAddrFromDir = (poolDir: TknDirInPool) => { return poolDir.isToken0 ? poolDir.pool.token1.address : poolDir.pool.token0.address }

    const paths = Arbitro()
    console.log("result: " + paths)
    function getTradeRoute(
        origin: string,
        current: string,
        amount: number,
        trade: Trade | null,
        checked: string[] = []): TradeRoute {
        
        const tradeRoute = new TradeRoute()
        if(trade)tradeRoute.trade = trade
        if(checked.length > 0 && checked.includes(current))return tradeRoute
        if(origin == current && trade)return tradeRoute
        
        
        checked.push(current)

        const targets = poolsByToken[current].reduce<TknDirInPool[]>((acc, pool) => {
            acc.push(pool)
            return acc
        }, [])

        const new_routes: TradeRoute[] = [];

        targets.forEach((t) => {
            if(trade == null){
            }else{
            }
            const new_trade = new Trade(t.isToken0, t.pool, amount)
            const amountOut = new_trade.Swap();
            const route = getTradeRoute(origin, getOtherTknAddrFromDir(t), amountOut, new_trade, checked)
            console.log( "on pool: " + t.pool.address)
            console.log( "comming from: " + trade?.poolData.address)
            route.trade = new_trade;
            new_routes.push(route)
        })

        tradeRoute.routes = new_routes;
        return tradeRoute;
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

    return (
        <div className="floating-bar">
            <div className="floating-bar-bar">
                <div>ARBITRO</div>
                <InputNumber set_value={setAmount} value={amount} />
                <WalletButton />
            </div>
            <div className="floating-bar-bar">
               
            </div>
        </div>
    );
}
