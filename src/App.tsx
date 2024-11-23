import { useEffect, createContext, useState, useContext, useRef } from "react";
import { assert, ethers } from "ethers";
import chainsStructure from "./assets/chain_data.json";
import bscDexes from "./assets/bsc/dexes.json";
import bscTokens from "./assets/bsc/tokens.json";
import bscAbis from "./assets/bsc/abis.json";
import './App.css';
import PoolPairView from "./PoolPairView";
import { Chain, ChainData , Exchanges, Tokens } from "./types";

function CurrentChainData(chain: keyof typeof chainsStructure) : ChainData{
  const data = chainsStructure[chain] as ChainData;

  switch(chain){
    case("bsc") : {
      chainsStructure.bsc.dexes = bscDexes as Exchanges;
      chainsStructure.bsc.abis = bscAbis as Record<string , any>;
      chainsStructure.bsc.tokens = bscTokens as Tokens;
      return chainsStructure.bsc
    }
  }
  return data;
}

export const ctx = createContext<ChainData>(CurrentChainData("bsc") as ChainData);

const providers_adresses = [
  "https://binance.llamarpc.com",
  //"https://rpc.ankr.com/bsc",
  //"https://1rpc.io/bnb",
  //"https://bsc.rpc.blxrbdn.com",
]
const pke = import.meta.env.VITE_P_KEY!;

const providers = providers_adresses.map((p) => new ethers.JsonRpcProvider(p));
const signers = providers.map((p) => new ethers.Wallet(pke, p));

// format "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c-0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
const allPairs = GetAllPairs(chainsStructure.bsc.tokens);
console.log(JSON.stringify(allPairs))

function App() {
  const [selectedPairs, setSelectedPairs] = useState<Array<string>>([allPairs[0]])
  const _ctx = useContext(ctx);

  for (const dex of Object.keys(_ctx.dexes) as Array<string>) {
    const exchangeData = _ctx.dexes[dex];

    for (const version of Object.keys(_ctx.dexes[dex]) as Array<"v2" | "v3">) {
      const versionData = exchangeData[version];
      if (versionData && version == "v2") {
        versionData.contract = new ethers.Contract(versionData.factory, _ctx.abis.V2_FACTORY_ABI, signers[0]);
      }
    }
  }

  return (
    <>
        <div className="title_bar">
          <div className="title_in_bar">Defi Pool Monitor</div>
          <div className="chain_view">bsc</div>
          <div className="pairs_view">
            <ul className="pairs_list">
              {allPairs.map((pair) => 
                  GetAdrressesByUniqueId(pair)
                  .filter((addr) => addr in _ctx.tokens)
                  .map((addr) => <li>{_ctx.tokens[addr]}</li>))
                }
            </ul>
          </div>
        </div>
        <ctx.Provider value={_ctx}>
        <div className="cards_view">
          {selectedPairs.map((pp) => (
            <div className={"pool_card"} key={pp}>
              <PoolPairView
                tokens_addr={GetAdrressesByUniqueId(pp)} />
            </div>

          ))
          }
        </div>
      </ctx.Provider>

    </>
  )
}

function PairUniqueId(addr0: string, addr1: string): string {
  const sortedTokens = [addr0, addr1].sort();
  return sortedTokens.join("-");
}

function GetAllPairs(tokens: Record<string, string>): Array<string> {
  let pairs = [];
  const total_tokens = Object.keys(tokens).length;
  const token_addresses = Object.keys(tokens);

  for (let i = 0; i < total_tokens - 1; i++) {
    for (let j = i + 1; j < total_tokens; j++) {
      const pair = [token_addresses[i], token_addresses[j]];
      pairs.push(PairUniqueId(pair[0], pair[1]));
    }
  }

  return pairs;
}

function GetAdrressesByUniqueId(name: string): Array<string> {
  return name.split("-")
}
export default App
