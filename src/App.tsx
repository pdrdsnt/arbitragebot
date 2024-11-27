import { createContext, useState, useContext, } from "react";
import { ethers } from "ethers";
import chainsStructure from "./assets/chain_data.json";
import bscDexes from "./assets/bsc/dexes.json";
import bscTokens from "./assets/bsc/tokens.json";
import bscAbis from "./assets/bsc/abis.json";
import './App.css';
import PoolPairView from "./PoolsView";
import { ChainData, Exchanges, PoolData, Tokens } from "./types";
import * as Utils from './Utils';
import PairsList from "./PairsList";
import ArbitrageAnalyzer from "./ArbitrageAnalyzer";

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
export const pools = createContext<Array<PoolData>>([]);
const providers_adresses = [
  "wss://bsc.callstaticrpc.com",
  //"https://rpc.ankr.com/bsc",
  //"https://1rpc.io/bnb",
  //"https://bsc.rpc.blxrbdn.com",
]
const pke = import.meta.env.VITE_P_KEY!;

const providers = providers_adresses.map((p) => new ethers.WebSocketProvider(p));
const signers = providers.map((p) => new ethers.Wallet(pke, p));

// format "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c-0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
const allPairs = Utils.GetAllPairs(chainsStructure.bsc.tokens);
//console.log(JSON.stringify(allPairs))

function App() {

  const [selectedPairs, setSelectedPairs] = useState<Array<string>>([allPairs[0]])
  const _ctx = useContext(ctx);
  _ctx.signers = signers;
  _ctx.providers = providers;

  function GetAdrressesByUniqueId(name: string): Array<string> {
    return name.split("-")
  }

  for (const dex of Object.keys(_ctx.dexes) as Array<string>) {
    const exchangeData = _ctx.dexes[dex];

    for (const version of Object.keys(_ctx.dexes[dex]) as Array<"v2" | "v3">) {
      const versionData = exchangeData[version];
      if (versionData && version == "v2") {
        versionData.contract = new ethers.Contract(versionData.factory, _ctx.abis.V2_FACTORY_ABI, signers[0]);
      } else if (versionData && version == "v3") {
        versionData.contract = new ethers.Contract(versionData.factory, _ctx.abis.V3_FACTORY_ABI, signers[0]);
      }
    }
  }

  const UpdateListOfSelectedPairs = (pair: string) => {
    setSelectedPairs(Utils.selectItemInList(pair, selectedPairs));
  };

  return (
    <>

      <div className="title-bar" key={"title_bar"}>
        <div className="title-in-bar">Defi Pool Monitor</div>
      </div>
      <div className="main-view" key={"main_view"}>
        <PairsList
          seleted={selectedPairs}
          allPairs={allPairs}
          updateParent={UpdateListOfSelectedPairs}
        >
        </PairsList>
        <pools.Provider value={[]}>
        <ctx.Provider value={_ctx}>
          <div className="cards-view">
            {selectedPairs.map((pair) => (
              <>
                <div className={"pool-card"} key={pair}>
                  <PoolPairView
                    tokens_addr={GetAdrressesByUniqueId(pair)} />
                </div>
              </>
            ))}
            <ArbitrageAnalyzer/>
          </div>
        </ctx.Provider>
        </pools.Provider>
      </div >
    </>
  )
}

export default App
