
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from "./App";
import { PoolData, ChainData, Exchanges, ExchangeVersion } from "./types";
import { ethers } from "ethers";
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
           // console.log("received pool data: " + poolData.dex + " " + poolData.version + " " + poolData.fee + " " + poolData.price)
            const new_pools_data = [...poolsData]
            new_pools_data[idx] = poolData
            setPoolsData((new_pools_data));

            sendPools(new_pools_data, tokens_id);
        } catch (error) {
            console.error("Error receiving pool data:", error);
            // Handle error, e.g., display error message to user
        }
    }
    async function getPoolContract(version: "v2" | "v3", factoryContract: any, fee: number): Promise<{ address: string, contract: ethers.Contract | null}> {
        try {
            const poolAddress = version === "v3"
                ? await factoryContract.getPool(tokens_addr[0], tokens_addr[1], fee)
                : await factoryContract.getPair(tokens_addr[0], tokens_addr[1]);

            if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
                const abi = version === "v3" ? _ctx.abis.V3_POOL_ABI : _ctx.abis.V2_POOL_ABI;
                const poolContract = new ethers.Contract(poolAddress, abi, _ctx.providers[0]);
                return { address: poolAddress, contract: poolContract };
            }
        } catch (err) {
            console.error(`Failed to fetch ${version} pool address:`, err);
        }
        return { address: "", contract: null};
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
                    if (version == 'v2') {
                        const r = await getPoolContract(version, factoryContract, 3000)
                        poolAddress = r.address;
                        poolContract = r.contract;
                        if (poolAddress && poolAddress != "0x0000000000000000000000000000000000000000") {
                            const pd: PoolData = new PoolData(
                                tokens_id,
                                poolContract,
                                dex,
                                version,
                                poolAddress,
                                _ctx.tokens[tokens_addr[0]],
                                _ctx.tokens[tokens_addr[1]],
                                Number(3000),
                                []
                            )
                            //updating context tree
                            versionData.pools[tokens_id] = pd
                            //updating local pools data for easier handling here
                            localPoolsData.push(pd)

                        }
                    }else
                    if (version == 'v3') {
                        const fees: number[] = [100, 500, 1000, 2000, 2500, 3000]; // List all fee tiers
                        const results = await Promise.all(
                            fees.map(async (fee) => {
                                const result = await getPoolContract("v3", factoryContract, fee);
                                return { ...result, fee }; // Include the fee in the result
                            })
                        );
                    
                        for (const { address, contract, fee } of results) {
                            if (address && contract && address != "0x0000000000000000000000000000000000000000") {
                                const pd: PoolData = new PoolData(
                                    tokens_id,
                                    contract, // Use the resolved contract
                                    dex,
                                    version,
                                    address, // Use the resolved address
                                    _ctx.tokens[tokens_addr[0]],
                                    _ctx.tokens[tokens_addr[1]],
                                    fee, // Use the fee from the result
                                    []
                                );
                    
                                localPoolsData.push(pd);
                                versionData.pools[tokens_id] = pd;
                            }
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
                {(poolsData).map((pd, idx) => (
                    <Pool poolData={pd} sendLastData={receivePoolData} idx={idx} />))}
            </div>

        </>
    );
}


