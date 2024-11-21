
import { useContext, useState, useEffect, useRef } from "react";
import { ctx } from "./App";
import { ethers } from "ethers";

export default function PoolPairView({ tokens_addr }: { tokens_addr: Array<string> }) {

    const _ctx: { [key: string]: any } = useContext(ctx);
    const _tokens: { [key: string]: string } = _ctx["tokens"]
    const [prices, setPrices] = useState<Record<string, number>>({})
    const [trigger, setTrigger] = useState(false)
    const isMounted = useRef(true); // Ref to track mounting state
    const pools_data: React.MutableRefObject<Record<string, any>> = useRef({})
    const dex_data = useRef(_ctx.exchanges_data);
    const tokens_id = tokens_addr.map((y) => _ctx.tokens[y]).join("-");
    const ready = useRef(false)
    //criando todos contratos na inicializacao
    useEffect(() => {
        async function getPoolAddress() {
            for (const dex of Object.keys(dex_data.current)) {
                for (const v of Object.keys(dex_data.current[dex])) {

                    if (v == "v3") {
                        dex_data.current[dex][v].pool = await dex_data.current[dex][v]["contract"].getPool(tokens_addr[0], tokens_addr[1], 500)
                        console.log( dex_data.current[dex][v].pool)
                    } else {
                        dex_data.current[dex][v].pool = await dex_data.current[dex][v]["contract"].getPair(tokens_addr[0], tokens_addr[1])
                    }
                    dex_data.current[dex][v][tokens_id] = new ethers.Contract(dex_data.current[dex][v]["pool"], _ctx.abis[v]["pool"], _ctx["signers"][0])
                }
            }
        }
        getPoolAddress();
        ready.current = true;
    }, [])

    useEffect(() => {
        console.log('Component mounted');
        if (!ready.current)return;


        async function setData() {

            const p = await GetPoolDataByExchange();

            if (!isMounted) return;

            pools_data.current = p;

            for (const key of Object.keys(p)) {
                var current_array: Array<any> = p[key]
                console.log(current_array)
            }
        }

        async function GetPoolDataByExchange() {

            let _pool_data: Record<string, any> = {}
            for (const dex of Object.keys(dex_data.current)) {
                for (const v of Object.keys(dex_data.current[dex])) {
                    try {
                        if (v == "v3") {
                            let slotData: Array<any> = []
                            try {
                                console.log(JSON.stringify(dex_data.current[dex][v][tokens_id]))
                                slotData = await dex_data.current[dex][v][tokens_id].slot0();
                            } catch (error) {
                                console.error(`Error fetching data for :`, error);
                            }
                            _pool_data[dex] = slotData
                            const price = decodeSqrtPriceX96Big(BigInt(slotData[0]))
                            console.log(price.token0PerToken1)
                            // Update prices state
                            setPrices((prevPrices) => {
                                // Make sure the price is a number before setting it
                                const newPrices = { ...prevPrices, [dex]: parseFloat(price.token1PerToken0) };
                                return newPrices;
                            });
                        }

                    } catch (error) {
                        console.error(`Error fetching data for :`, error);
                    }
                }
            }

            const prices_difference = prices["uniswap"] - prices["pancake"]

            setPrices((prevPrices) => {
                // Make sure the price is a number before setting it
                const newPrices = { ...prevPrices, difference: prices_difference };
                return newPrices;
            });

            return _pool_data
        }

        setData();

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
                            <div className="pool_data_elemet">{prices[p]}</div>
                        </li>
                        <li className="pool_address" key={dex_data.current[p]["address"]}>
                            Address: {dex_data.current[p]["address"]}
                        </li>
                    </div>
                ))}
            </ul>
            <div>{prices["difference"]}</div>
        </>
    );
}


function decodeSqrtPriceX96Big(sqrtPriceX96: BigInt): { token1PerToken0: string; token0PerToken1: string } {
    const Q96 = BigInt(2) ** BigInt(96); // 2^96

    // Divide by Q96 to get the square root of the price
    const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);

    // Calculate prices
    const token1PerToken0 = Math.pow(sqrtPrice, 2); // (sqrtPrice)^2
    const token0PerToken1 = 1 / token1PerToken0; // Reciprocal of the price

    return {
        token1PerToken0: token1PerToken0.toString(),
        token0PerToken1: token0PerToken1.toString(),
    };
}
