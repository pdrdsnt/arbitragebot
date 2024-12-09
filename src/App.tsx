import { createContext, useState, useContext, useEffect, useMemo, } from "react";
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
import Arbitro from "./Arbitro";

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
  const [mountedPoolsContainers, setMountedPoolContainers] = useState(new Set())
  const [poolsByComponent, setPoolsByComponent] = useState<Record<string, Array<PoolData>>>({})
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
  useEffect(() => {
    const invalidPairs = Object.keys(poolsByComponent).filter(
      (component_ids) => !selectedPairs.includes(component_ids)
    );

    invalidPairs.forEach((component_ids) => handleSetPools([], component_ids));
  }, [selectedPairs]);
  const allPools = useMemo(() => {
    return Object.values(poolsByComponent).flat();

  }, [poolsByComponent]);
  const handleMountedComponents = (component_id: string, isMounted: boolean) => {
    setMountedPoolContainers((prevSet) => {
      const updatedSet = new Set(prevSet); // Create a new Set based on the previous state
      if (isMounted) {
        updatedSet.add(component_id); // Add the component ID if it's mounted
      } else {
        updatedSet.delete(component_id); // Remove the component ID if it's unmounted
      }
      return updatedSet; // Return the new Set to update the state
    });
  }
  const handleSetPools = (pools: Array<PoolData>, component_id: string) => {
    console.log("updating pools in parent")
    if(!mountedPoolsContainers.has(component_id)){
      console.log("called by unmonted component")
      return
    }
    setPoolsByComponent((prev) => {
      const updatedPools = { ...prev };
      if (pools.length === 0) {
        // Remove key if no pools
        delete updatedPools[component_id];
      } else {
        // Update pools for the given component
        updatedPools[component_id] = pools;
      }
      return updatedPools; // Return a new object reference
    });
  };
  const selectToken = (tkn: string) => {
    if (!selectedTokens.includes(tkn)) {
      setSelectedTokens([...selectedTokens, tkn])
    } else {
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
              <div className={"pool-card"} key={pair}>
                <PoolPairView
                  tokens_addr={Utils.GetAdrressesByUniqueId(pair)}
                  handlePools={handleSetPools}
                  setIsMounted={handleMountedComponents}
                />
              </div>
            ))}
          </div>
          <Arbitro pools={allPools} />
        </ctx.Provider>
      </div >
      <div className="empty-space" />
    </>
  )
}

export default App
