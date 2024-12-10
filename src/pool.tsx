import { useEffect, useRef, useState } from "react";
import { PoolData, RequestsStream } from "./types";
import { GetNamesByUniqueId, PairUniqueId, UpdateV2Data, UpdateV3Data } from "./Utils";
import { PromiseState } from "./PromiseState";
import { assert } from "ethers";

export default function Pool( {poolData, sendLastData} : {poolData: PoolData, sendLastData: CallableFunction} ) {
    const tokens_addr = [poolData.token0.address, poolData.token1.address]
    const tokens_id = PairUniqueId(tokens_addr[0], tokens_addr[1])
    const [trigger, setTrigger] = useState(false)

    const refData = useRef<RequestsStream<PoolData>>({currentPoolRequest: 0, promiseStateArray: []})

    const [latestData, setLatestData] = useState<PoolData | null>(null)
    
    useEffect(() => {
       
        function SetUpRequest() {
            if (poolData.contract) {
                let old_pool_data: PoolData = poolData;
                let new_pool_data: Promise<PoolData>
                if (old_pool_data) {
                    if (poolData.version == "v3" && old_pool_data) {
                        new_pool_data = UpdateV3Data(poolData.contract, old_pool_data)
                    }
                    else {
                        new_pool_data = UpdateV2Data(poolData.contract, old_pool_data)
                    }
                    const newPromisse = new PromiseState(new_pool_data)
                   
                    refData.current.promiseStateArray.push(newPromisse)
                    refData.current.currentPoolRequest += 1;
                }
            }
        }
        SetUpRequest();

        async function UpdateState() {
            for(const r of refData.current.promiseStateArray){
                r.getState()
                if(r.done && r.result){
                    setLatestData(r.result)
                    console.log("updated: " + r.result.dex + " version: " + r.result.version)
                }
            }
        }

        UpdateState()
        
    }, [trigger])


    //update trigger
    useEffect(() => {
        const interval = setInterval(() => {    
            setTrigger((prev) => !prev); // Trigger updates
        }, 2000);

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval);
    }); // Empty dependency array ensures this runs only once

    return (
        <div className="pool-card">
            <ul className="tokens-names-in-card" key={tokens_id + "1"}>
                <li className="address">{latestData?.address.toString()}</li>
                <li>{latestData?.dex + " version: " + latestData?.version + " " + latestData?.fee}</li>
                <li className="pool-data-property-result">
                    {<div className="pool-data-property-result">{latestData?.price.toString()}</div>}
                    {<div>{latestData?.volume.toString()}</div>}
                </li>
            </ul>
        </div>
    )

}