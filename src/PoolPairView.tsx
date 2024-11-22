
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from "./App";
import { ethers, toNumber } from "ethers";
import PoolData, { Exchange, ExchangeVersion, PairPath } from "./types";
import { BigNumberish } from "ethers";
export default function PoolPairView({ tokens_addr }: { tokens_addr: Array<string> }) {

    const _ctx: { [key: string]: any } = useContext(ctx);
    const _tokens: { [key: string]: string } = _ctx["tokens"]
    const [trigger, setTrigger] = useState(false)
    const pair_paths = useRef<Array<PairPath>>([])
    const isMounted = useRef(true); // Ref to track mounting state
    const dex_data: React.MutableRefObject<Exchange> = useRef(_ctx.exchanges_data.dexes);
    const tokens_id = tokens_addr.map((y) => _ctx.tokens[y]).join("-");
    const ready = useRef(false)

    function* createDexIterator(_dex_data: React.MutableRefObject<Exchange>) {
        const dex_list = dex_data.current;
        for (const dex of Object.keys(dex_list)) {
            const dexData = _dex_data.current[dex]
            for (const version of Object.keys(dexData) as Array<"v2" | "v3">) {
                const versionData: ExchangeVersion | undefined = dexData[version];
                if (versionData) {
                    yield { dex, version, versionData }; // Yield each dex and version data
                }
            }
        }
    }

    useEffect(() => {
        //criando todos contratos de cada exchange relativo ao par representado
        //essa funcao so vai ser chamada uma vez
        async function getPoolAddress() {

            for (const { dex, version, versionData } of createDexIterator(dex_data)) {
                const factoryContract = versionData.contract;
                if (factoryContract) {
                    let contract = null;
                    if (version == "v3") {
                        contract = await factoryContract.getPool(tokens_addr[0], tokens_addr[1], 500)
                    }
                    else {
                        contract = await factoryContract.getPair(tokens_addr[0], tokens_addr[1])
                    }

                    if (contract) {
                        //global data
                        versionData.pools[tokens_id].pair_contract = contract;
                        pair_paths.current.push(new PairPath(dex, version, tokens_id))
                    }
                }
            }
        }
        getPoolAddress();
        ready.current = true;
    }, [])

    useEffect(() => {
        console.log('Component mounted');
        if (!ready.current) return;

        async function UpdatePoolsAndPathsRef() {
            let slotData = [];
            for (const { dex, version, versionData } of createDexIterator(dex_data)) {
                const factoryContract = versionData.contract;
                if (factoryContract) {

                    let price: number = 0
                    if (version == "v3") {
                        slotData = await versionData.pools[tokens_id].pair_contract.slot0();
                        price = toNumber(decodeSqrtPriceX96Big(BigInt(slotData[0])))
                    }
                    else {
                        const reserves: Array<BigNumberish> = await versionData.pools[tokens_id].pair_contract.getReserves();
                        price = toNumber(reserves[1]) / toNumber(reserves[0]);
                    }
                }
            }
        }

        async function UpdateStates() {
            await UpdatePoolsAndPathsRef();
            if (!isMounted) return;


            

        }


        return () => {
            isMounted.current = false;
        };


    }, [trigger])


    useEffect(() => {
        // Set an interval to update the trigger every 0.5 seconds
        const interval = setInterval(() => {
            setTrigger((prev) => !prev); // Toggle the trigger value
        }, 400099);

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval);
    }, []); // Empty dependency array ensures this runs only once

    return (
        <>
            <div className="token_title_bar">
                {tokens_addr.map((p) => (
                    <h4 className="token" key={_tokens[p]}>{_tokens[p]}</h4>
                ))}
            </div>
            <ul className="pools_data_view">
                {Object.keys(dex_data.current).map((p) => (
                    <div key={p}>
                        <li className="pool_data">
                            <div className="pool_data_elemet">{p}</div>
                            
                        </li>
                    </div>
                ))}
            </ul>
        </>
    );
}


function decodeSqrtPriceX96Big(sqrtPriceX96: BigInt): string {
    const Q96 = BigInt(2) ** BigInt(96); // 2^96

    // Divide by Q96 to get the square root of the price
    const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);

    // Calculate prices
    const token1PerToken0 = Math.pow(sqrtPrice, 2); // (sqrtPrice)^2
    const token0PerToken1 = 1 / token1PerToken0; // Reciprocal of the price

    return token0PerToken1.toString();
}
