import { useContext} from "react";
import { PoolData } from "./types";
import { ctx } from "./App";
import Decimal from "decimal.js";
export default function PoolsSeeker({ pools }: { pools: Array<PoolData> }) {
    if (pools.length == 0) return;
    const poolsbyTokens: Record<string, Array<PoolData>> = {}
    pools.forEach((x) => {
        if (!Array.isArray(poolsbyTokens[x.token0.address])) {
            poolsbyTokens[x.token0.address] = []; // Create an empty array if it doesn't exist
        }
        if (!Array.isArray(poolsbyTokens[x.token1.address])) {
            poolsbyTokens[x.token1.address] = []; // Create an empty array if it doesn't exist
        }
        poolsbyTokens[x.token0.address].push(x)
        poolsbyTokens[x.token1.address].push(x)
    })
    const _ctx = useContext(ctx);
    const poolsSortedPrice = [...pools].sort((a, b) => Number(a.price.minus(b.price)));

    return (
        <>
            <div className="pool-card">
                {poolsSortedPrice.map((p) => (
                    <div key={p.address + p.dex + p.version}>
                        <li className="pool-data">
                            <div className="pool-data-elemet">
                                <div className="mini-title-bar">
                                    <div className="pool-data-dex-title">{p.dex + " " + p.version}</div>
                                    <div className="pool-data-property-title">{p.volume.toString()}</div>
                                </div>
                                <div>
                                    <div className="pool-data-data-container" key={"priceview"}>
                                        <div className="pool-data-property-title">1 {_ctx.tokens[p.token0.address].name}: </div>
                                        <div className="pool-data-dex-data">{p.price.toString()}</div>
                                        <div className="pool-data-dex-data">{new Decimal(p.price_impact.toString()).toString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="address">{p.address}</div>
                        </li>
                    </div>
                ))
                }
            </div>
        </>)
}