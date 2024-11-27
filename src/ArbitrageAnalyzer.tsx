import { useContext, useState } from "react";
import { PoolData } from "./types";
import { pools } from "./App";

export default function ArbitrageAnalyzer() {

    const _poolsData: Array<PoolData> = useContext(pools)
    console.log("POOL DATA ")
    useContext(pools).forEach((d) => console.log("POOL DATA = " + d.address))
    return (<>
        <div>
            {_poolsData.map((v => (
                <>
                    <h1>Ddddddddddddddddddddddddd</h1>
                    <h1>{v.address}</h1>
                </>
            )))}
        </div>
    
    </>)

}