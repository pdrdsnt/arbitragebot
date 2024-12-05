
import { useContext, useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { ctx } from "./App";
import {PoolData, ChainData, Exchanges, ExchangeVersion } from "./types";
import { ethers } from "ethers";
import {GetNamesByUniqueId, PairUniqueId, UpdateV2Data, UpdateV3Data } from "./Utils";
import PoolsSeeker from "./PoolsSeeker";
export default function PoolsContainer({ tokens_addr,_pools }: { tokens_addr: Array<string> , _pools: Dispatch<SetStateAction<PoolData[]>> }) {

    const _ctx: ChainData = useContext(ctx);
    const [trigger, setTrigger] = useState(false)
    const [poolsData, setPoolsData] = useState<Array<PoolData>>([])
    const isMounted = useRef(true); // Ref to track mounting state
    const tokens_id = PairUniqueId(tokens_addr[0], tokens_addr[1]);
    const ready = useRef(false)

    function* createDexIterator(_dex_data: Exchanges) {
        const dex_list = _dex_data;
        for (const dex of Object.keys(dex_list)) {
            const dexData = _dex_data[dex]
            for (const version of Object.keys(dexData) as Array<"v2" | "v3">) {
                const versionData: ExchangeVersion | undefined = dexData[version];
                //console.log(version)
                if (versionData) {
                    yield { dex, version, versionData }; // Yield each dex and version data
                }
            }
        }
    }
    //initialization, creating poolData objects
    useEffect(() => {
        const _poolsData: Array<PoolData> = []
        async function initializeContracts() {
            for (const { dex, version, versionData } of createDexIterator(_ctx.dexes)) {
                const factoryContract = versionData.contract;
                let poolContract: any = null
                if (factoryContract) {
                    let poolAddress: string = "";
                    if (version == "v3") {
                        try {
                            poolAddress = await factoryContract.getPool(tokens_addr[0], tokens_addr[1], 500)
                            poolContract = new ethers.Contract(poolAddress, _ctx.abis.V3_POOL_ABI, _ctx.providers[0]);
                            //console.log(version)
                        } catch (err) {
                            console.log("cannot get pair address. Error= " + err)
                        }
                    }
                    else if (version == "v2") {
                        try {
                            poolAddress = await factoryContract.getPair(tokens_addr[0], tokens_addr[1])
                            poolContract = new ethers.Contract(poolAddress, _ctx.abis.V2_POOL_ABI, _ctx.providers[0]);
                            //console.log(version)
                        } catch (err) {
                            console.log("cannot get pair address. Error= " + err)
                        }
                    }
                    if (poolAddress && poolAddress != "0x0000000000000000000000000000000000000000") {
                        const pd: PoolData = new PoolData(
                            tokens_id,
                            poolContract,
                            dex,
                            version,
                            poolAddress,
                            _ctx.tokens[tokens_addr[0]],
                            _ctx.tokens[tokens_addr[1]],
                            []
                        )

                        //updating context tree
                        versionData.pools[tokens_id] = pd

                        //updating local pools data for easier handling here
                        _poolsData.push(pd);
                    }
                }
            }
            setPoolsData(_poolsData)
            setTrigger(!trigger)
        }
        initializeContracts();
        ready.current = true;
    }, [])

    //update values of the Array<poolData> created 
    useEffect(() => {
        if (!ready.current) return;

        async function UpdatePoolsData() 
        {
            let _poolData: Array<PoolData> = [];
            for (const {version, versionData } of createDexIterator(_ctx.dexes)) {
                const factoryContract = versionData.contract;
                if (factoryContract) {
                    let new_pool_data: PoolData = versionData.pools?.[tokens_id];
                    if (new_pool_data) {
                        if (version == "v3" && new_pool_data) {
                            
                            const pool_contact = versionData.pools[tokens_id].contract;
                            new_pool_data = await UpdateV3Data(pool_contact,new_pool_data)
                            // Use the observe method to get historical data
                        }
                        else
                        {
                            const pool_contact = versionData.pools[tokens_id].contract;
                            new_pool_data = await UpdateV2Data(pool_contact,new_pool_data)
                            
                        }
                    
                        _poolData.push(new_pool_data)
                    }}}
            return _poolData;
        }

        async function UpdateStates() {
            const _poolsData = await UpdatePoolsData();

            if (!isMounted) return;
            setPoolsData(_poolsData)

            _pools(_poolsData);
        }

        UpdateStates();

        return () => {
            isMounted.current = false;
        };
    }, [trigger])

    //update trigger
    useEffect(() => {
        // Set an interval to update the trigger every 0.5 seconds
        const interval = setInterval(() => {
            setTrigger((prev) => !prev); // Toggle the trigger value
        }, 1000);

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval);
    }); // Empty dependency array ensures this runs only once

    return (
        <>
            <div className="token-title-bar">
                <div className="tokens-names-in-card" key={tokens_id + "0"}>
                    {GetNamesByUniqueId(tokens_id, " /").map((p) => (
                            <h4 className="token" key={p}> {p} </h4>
                    ))}
                </div>
                <div className="tokens-names-in-card" key={tokens_id + "1"}>
                    {tokens_addr.map((p) => (
                            <h4 className="pool-address" key={p + "in title"}> {p} </h4>
                    ))}
                </div>
            </div>
            <ul className="pools-data-view">
                <PoolsSeeker pools={poolsData}/>
            </ul>
           
        </>
    );
}


