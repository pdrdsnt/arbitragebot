
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from "./App";

import PoolData, { ChainData, Exchanges, ExchangeVersion } from "./types";
import { ethers } from "ethers";
import { decodeSqrtPriceX96Big, PairUniqueId } from "./Utils";
export default function PoolsView({ tokens_addr }: { tokens_addr: Array<string> }) {

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
                            poolContract = new ethers.Contract(poolAddress, _ctx.abis.V3_POOL_ABI, _ctx.signers[0]);
                            //console.log(version)
                        } catch (err) {
                            console.log("cannot get pair address. Error= " + err)
                        }
                    }
                    else if (version == "v2") {
                        try {
                            poolAddress = await factoryContract.getPair(tokens_addr[0], tokens_addr[1])
                            poolContract = new ethers.Contract(poolAddress, _ctx.abis.V2_POOL_ABI, _ctx.signers[0]);
                            //console.log(version)
                        } catch (err) {
                            console.log("cannot get pair address. Error= " + err)
                        }
                    }
                    if (poolAddress && poolAddress != "0x0000000000000000000000000000000000000000") {
                        const pd: PoolData = new PoolData(poolContract, dex, version, poolAddress, tokens_addr[0], tokens_addr[1])

                        //updating context tree
                        versionData.pools[tokens_id] = pd

                        //updating local pools data for easier handling here
                        _poolsData.push(pd);
                    }
                }
            }
            setPoolsData(_poolsData)
        }
        initializeContracts();
        ready.current = true;
    }, [])

    useEffect(() => {
        console.log('Component mounted');
        if (!ready.current) return;

        async function UpdatePoolsData() {
            let _poolData: Array<PoolData> = [];
            for (const { dex, version, versionData } of createDexIterator(_ctx.dexes)) {
                const factoryContract = versionData.contract;
                console.log("factory_contract: " + factoryContract)
                if (factoryContract) {
                    let price: number = 0
                    const new_pool_data: PoolData = versionData.pools?.[tokens_id];

                    if (new_pool_data) {
                        console.log("new pool data : " + new_pool_data)
                        if (version == "v3") {
                            const _slot0Data = await versionData.pools[tokens_id].pair_contract.slot0();
                            price = Number(decodeSqrtPriceX96Big(_slot0Data[0] as bigint))
                        }
                        else {
                            const reserves: Array<bigint> = await versionData.pools[tokens_id].pair_contract.getReserves();
                            const priceBigInt = (reserves[1] * 10n ** 18n) / reserves[0];
                            price = Number(priceBigInt) / 10 ** 18;

                        }
                        new_pool_data.price = price
                        console.log(price)
                        _poolData.push(new_pool_data)
                    }
                }
            }
            return _poolData;
        }

        async function UpdateStates() {
            const _poolsData = await UpdatePoolsData();

            if (!isMounted) return;
            setPoolsData(_poolsData)
        }

        UpdateStates();


        return () => {
            isMounted.current = false;
            console.log(poolsData)
        };
    }, [trigger])

    //update trigger
    useEffect(() => {
        // Set an interval to update the trigger every 0.5 seconds
        const interval = setInterval(() => {
            setTrigger((prev) => !prev); // Toggle the trigger value
        }, 2000);

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval);
    }); // Empty dependency array ensures this runs only once

    return (
        <>
            <div className="token_title_bar">
                {tokens_addr.map((p) => (
                    <h4 className="token" key={_ctx.tokens[p].name}> {_ctx.tokens[p].name} </h4>
                ))}
            </div>
            <ul className="pools_data_view">
                {poolsData.map((p) => (
                    <div key={p.address + p.dex + p.version}>
                        <li className="pool_data">
                            <div className="pool_data_elemet">
                                <div className="pool_data_dex_titile">{p.dex + " " + p.version}</div>
                                <div className="pool_data_dex_titile">{p.price}</div>
                            </div>
                            <div className="pool_address">{p.address}</div>
                            <div>{ }</div>

                        </li>
                    </div>
                ))}
            </ul>
        </>
    );
}


