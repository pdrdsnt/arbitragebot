
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from "./App";
import { PoolData, ChainData, Exchanges, ExchangeVersion } from "./types";
import { ethers} from "ethers";
import { GetNamesByUniqueId, PairUniqueId } from "./Utils";
import Pool from "./pool";
export default function PoolsContainer({ tokens_addr, sendPools, setIsMounted }: { tokens_addr: Array<string>, sendPools: CallableFunction, setIsMounted: CallableFunction }) {

    const _ctx: ChainData = useContext(ctx);
    const [poolsData, setPoolsData] = useState<PoolData[]>([])
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

    function receivePoolData(poolData: PoolData, idx: number) {
        try {
            console.log("received pool data: " + poolData.dex + " " + poolData.version + " " + poolData.fee + " " + poolData.price)
            const new_pools_data = [...poolsData]
            new_pools_data[idx] = poolData
            setPoolsData((new_pools_data));
        
            sendPools(new_pools_data, tokens_id); 
          } catch (error) {
            console.error("Error receiving pool data:", error);
            // Handle error, e.g., display error message to user
          }
    }
    
    //initialization, creating poolData objects
    useEffect(() => {
        const localPoolsData: Array<PoolData> = [];
        setIsMounted(tokens_id, true)
        isMounted.current = true
        async function initializeContracts() {
            for (const { dex, version, versionData } of createDexIterator(_ctx.dexes)) {
                const factoryContract = versionData.contract;
                let poolContract: any = null

                if (factoryContract) {
                    let poolAddress: string = "";
                    const fees: number[] = [100, 500, 1000, 2000, 2500, 3000]; // List all fee tiers
                    for (let fee of fees) {
                        if (version == "v3") {
                            try {
                                poolAddress = await factoryContract.getPool(tokens_addr[0], tokens_addr[1], Number(fee))
                                poolContract = new ethers.Contract(poolAddress, _ctx.abis.V3_POOL_ABI, _ctx.providers[0]);
                            } catch (err) {
                                console.log("cannot get pair address. Error= " + err)
                                continue
                            }
                        }
                        else if (version == "v2") {
                            try {
                                poolAddress = await factoryContract.getPair(tokens_addr[0], tokens_addr[1])
                                poolContract = new ethers.Contract(poolAddress, _ctx.abis.V2_POOL_ABI, _ctx.providers[0]);
                                fee = 3000
                                //console.log(version)
                            } catch (err) {
                                console.log("cannot get pair address. Error= " + err)
                                continue
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
                                Number(fee),
                                []
                            )

                            //updating context tree
                            versionData.pools[tokens_id] = pd

                            //updating local pools data for easier handling here
                            localPoolsData.push(pd)
                        }
                    }
                }
            }
            setPoolsData(localPoolsData)

        }
        initializeContracts();
        ready.current = true;

        return () => {
            setPoolsData([])
            sendPools([], tokens_id);
            setIsMounted(tokens_id, false)
            ready.current = false;
            isMounted.current = false;
        }

    }, [])

    return (
        <>
            <div className="pool-view" key={tokens_id}>
                {GetNamesByUniqueId(tokens_id, " ").map((p, i) => (
                    <div className="token-title-bar">
                        <div className="token" key={p}> {p} </div>
                        <div className="address" key={_ctx.tokens[tokens_addr[i]].address}> {_ctx.tokens[tokens_addr[i]].address} </div>
                    </div>

                ))}
            </div>
            <div className="pool-data-container">
                {(poolsData).map((pd,idx) => (
                    <Pool poolData={pd} sendLastData={receivePoolData} idx={idx} />))}
            </div>

        </>
    );
}


