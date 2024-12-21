import { PoolData, Trade, TradeRoute } from "./types";
import "./App.css"
import InputNumber from "./InputNumber";
import { useState } from "react";
import WalletButton from "./WalletButton";
import BigNumber from "bignumber.js";
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

    function Arbitro(tokenAddress: string): TradeRoute | null {
        
        let routes: TradeRoute | null = null
       // for (const p of poolsByToken[tokenAddress]) {
          //  const new_trade = new Trade(!p.isToken0, p.pool, BigNumber(100))
       //     const r: TradeRoute = getTradeRoute(tokenAddress, BigNumber(100), new_trade)
       //     routes = r;
        //}
        //console.log("routes: " + routes)

        const target_pool = poolsByToken[tokenAddress][0]
        console.log("pool: " + target_pool.pool.address)
        const new_trade = new Trade(!target_pool.isToken0, target_pool.pool, BigNumber(100))
        const r: TradeRoute = getTradeRoute(tokenAddress, BigNumber(100), new_trade)
        routes = r;

        return routes

    }

    //const getTknAddrFromDir = (poolDir: TknDirInPool) => { return poolDir.isToken0 ? poolDir.pool.token0.address : poolDir.pool.token1.address }
    //const getOtherTknAddrFromDir = (poolDir: TknDirInPool) => { return poolDir.isToken0 ? poolDir.pool.token1.address : poolDir.pool.token0.address }

    function getTradeRoute(origin: string, amount: BigNumber, trade: Trade, checked: string[] = []): TradeRoute {
        let current = origin
        const new_checked = [...checked]
        //console.log("checked: " + new_checked.length)
        const tradeRoute = new TradeRoute()

        //trade is null in the first call

        const token0 = trade.from0 ? trade.poolData.token0 : trade.poolData.token1;
        const token1 = trade.from0 ? trade.poolData.token1 : trade.poolData.token0;
        console.log(" current token : " +  token0.name + " comming from " + token1.name)
        tradeRoute.trade = trade
        new_checked.push(trade.poolData.address)
        current = trade.from0 ? trade.poolData.token0.address : trade.poolData.token1.address
        
        console.log("starting with: " + trade.amountIn + " of " + (trade.from0 ? trade.poolData.token0.name : trade.poolData.token1.name))
        //path returned to first token
        if (origin == current && trade) {
            console.log("ending with with: " + trade.amountOut + " of " + (trade.from0 ? trade.poolData.token1.name : trade.poolData.token0.name))
        
            return tradeRoute
        }

        //all pools (edges) that this token (node) is connected to
        const edges = poolsByToken[current].reduce<TknDirInPool[]>((acc, pool) => {
            acc.push(pool)
            return acc
        }, [])

        const new_routes: TradeRoute[] = [];
        let i = 0;
        //console.log(" looping: " + current)
        for (const edge of edges) {
            if (new_checked.includes(edge.pool.address)) {
                console.log("checked includes pool" + checked)
                continue
            }

            console.log(i + " going to : " + edge.pool.address)           
            const new_trade = new Trade(!edge.isToken0, edge.pool, trade?.amountOut)
            const route = getTradeRoute(origin, amount, new_trade, new_checked)

            //console.log( "comming from: " + trade?.poolData.address)
            new_routes.push(route)
            i++
        }
        //console.log("new routes" + new_routes)
        tradeRoute.routes = new_routes;
        return tradeRoute;
    }

    function extractPaths(route: TradeRoute): Array<Array<Trade>> {
        if (!route) return []
        if (route.routes.length < 1 && route.trade) return [[route.trade]]
        const paths: Array<Array<Trade>> = []
        for (const i of route.routes) {
            const subpaths = extractPaths(i)
            for (const s of subpaths) {
                if (route.trade) s.push(route.trade)
                paths.push([...s])
            }
        }
        return paths
    }
    
    const routes = tokens.length > 0 ? Arbitro(tokens[0]) : null
    if (routes) {
        const paths = extractPaths(routes)

        paths.forEach((x) => {
            //console.log( "path: " + x)
            x.forEach((_x, idx) => {
            //console.log( "result: " + idx + " - " + _x.poolData.address + " - " + (_x.from0 ? _x.poolData.token0.name : _x.poolData.token1.name) + " value: " + _x.amountOut)

            })
        })
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
