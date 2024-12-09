
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from "./App";
import { PoolData, ChainData, Exchanges, ExchangeVersion } from "./types";
import { ethers } from "ethers";
import { GetNamesByUniqueId, PairUniqueId } from "./Utils";
import PoolsSeeker from "./PoolsSeeker";
import Pool from "./pool";
export default function PoolsContainer({ tokens_addr, handlePools, setIsMounted }: { tokens_addr: Array<string>, handlePools: CallableFunction, setIsMounted: CallableFunction }) {

    const _ctx: ChainData = useContext(ctx);
    const [poolsData, setPoolData] = useState<Record<string, PoolData>>({})
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

    function receivePoolData(poolData: PoolData) {
        setPoolData((prevPools) => ({
            ...prevPools, // Spread the existing poolsData
            [poolData.address]: poolData, // Add or update the specific pool data
        }));
    }
    //initialization, creating poolData objects
    useEffect(() => {
        setIsMounted(tokens_id, true)
        isMounted.current = true
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
                        setPoolData((prevPools) => ({
                            ...prevPools, // Spread the existing poolsData
                            [poolAddress]: pd, // Add or update the specific pool data
                        }));
                    }
                }
            }
        }
        initializeContracts();
        ready.current = true;

        return () => {
            handlePools([], tokens_id);
            setIsMounted(tokens_id, false)
            ready.current = false;
            isMounted.current = false;
        }

    }, [])

    return (
        <>
            <div className="tokens-names-in-card" key={tokens_id + "0"}>
                {GetNamesByUniqueId(tokens_id, " /").map((p) => (
                    <h4 className="token" key={p}> {p} </h4>
                ))}
            </div>
            <div className="token-title-bar">
                {Object.keys(poolsData).map((pd) => (
                    <Pool poolData={poolsData[pd]} sendLastData={receivePoolData} />))}
            </div>
        </>
    );
}


