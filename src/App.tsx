import { createContext, useState, useContext, useEffect, } from "react";
import { ethers } from "ethers";
import chainsStructure from "./assets/chain_data.json";
import bscDexes from "./assets/bsc/dexes.json";
import bscTokens from "./assets/bsc/tokens.json";
import bscAbis from "./assets/bsc/abis.json";
import './App.css';
import PoolPairView from "./PoolsContainer";
import { ChainData, Exchanges, PoolData, Tokens } from "./types";
import * as Utils from './Utils';
import WalletButton from "./WalletButton";
import TokenSelector from "./TokenSelector";

function CurrentChainData(chain: keyof typeof chainsStructure): ChainData {
  const data = chainsStructure[chain] as ChainData;

  switch (chain) {
    case ("bsc"): {
      chainsStructure.bsc.dexes = bscDexes as Exchanges;
      chainsStructure.bsc.abis = bscAbis as Record<string, any>;
      chainsStructure.bsc.tokens = bscTokens as Tokens;

      return chainsStructure.bsc
    }
  }
  return data;
}
export const ctx = createContext<ChainData>(CurrentChainData("bsc") as ChainData);

const providers_adresses = [
  "wss://bsc.callstaticrpc.com",
  "wss://bsc-rpc.publicnode.com",
  //"https://1rpc.io/bnb",
  //"https://bsc.rpc.blxrbdn.com",
]
const providers = providers_adresses.map((p) => new ethers.WebSocketProvider(p));

function App() {
  const [selectedTokens, setSelectedTokens] = useState<Array<string>>([])
  const [selectedPairs, setSelectedPairs] = useState<Array<string>>([])
  const _ctx = useContext(ctx);

  _ctx.providers = providers;

  //for each dex in the chain
  for (const dex of Object.keys(_ctx.dexes) as Array<string>) {
    const exchangeData = _ctx.dexes[dex];
    //for each version of this dex
    for (const version of Object.keys(_ctx.dexes[dex]) as Array<"v2" | "v3">) {
      const versionData = exchangeData[version];
      if (versionData && version == "v2") {
        versionData.contract = new ethers.Contract(versionData.factory, _ctx.abis.V2_FACTORY_ABI, providers[0]);
      } else if (versionData && version == "v3") {
        versionData.contract = new ethers.Contract(versionData.factory, _ctx.abis.V3_FACTORY_ABI, providers[0]);
      }
    }
  }

  useEffect(() => {
    setSelectedPairs(Utils.GetAllPairs(selectedTokens))
  }, [selectedTokens])

  const [_, setPools] = useState<Array<PoolData>>([]);

  const selectToken = (tkn: string) => {
    if(!selectedTokens.includes(tkn)){
      setSelectedTokens([...selectedTokens,tkn])
    }else{
      setSelectedTokens(selectedTokens.filter((x) => x != tkn))
    }
  }

  return (
    <>
      <div className="title-bar" key={"title_bar"}>
        <div className="title-in-bar">💀</div>
        <TokenSelector handleTokenSelect={selectToken} selectedTokens={selectedTokens} />
        <WalletButton />
      </div>
      <div className="main-view" key={"main_view"}>
        <ctx.Provider value={_ctx}>
          <div className="cards-view" key={"cardsview"}>
            {selectedPairs.map((pair) => (
              <>
                <div className={"pool-card"} key={pair}>
                  <PoolPairView
                    tokens_addr={Utils.GetAdrressesByUniqueId(pair)}
                    _pools={setPools} />
                </div>
              </>
            ))}

          </div>
        </ctx.Provider>
      </div >
    </>
  )
}

export default App
