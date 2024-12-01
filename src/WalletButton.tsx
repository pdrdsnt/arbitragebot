import { useContext, useEffect, useState } from "react"
import { ctx } from "./App"
import { ethers } from "ethers"
export default function WalletButton() {
    const _ctx = useContext(ctx);
    const [isConnected, setConnect] = useState(true)
    const [signerAddress, setSignerAddress] = useState("");
    useEffect(() => {
        if (isConnected) {
            (async () => {
                await connectWallet();
            })();
        } else {
            disconnectWallet();
        }
    }, [isConnected]);

    const handleClick = () => {
        if (isConnected) {
            setConnect(false)
        } else {
            setConnect(true)
        }
    }


    async function connectWallet() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum !== 'undefined') {
                let metaMaskProvider = null;
                if (window.ethereum.providers) {
                    console.log('Multiple providers found:', window.ethereum.providers);

                    for (const provider of window.ethereum.providers) {
                        try {
                            await provider.request({ method: 'eth_requestAccounts' });
                            console.log(`Connected to provider: ${provider.isMetaMask ? 'MetaMask' : 'Other'}`);
                            metaMaskProvider = provider
                            break
                        } catch {
                            console.log('Connection request canceled for a provider.');
                            setConnect(false)
                            continue
                        }
                    }
                }
                if(!metaMaskProvider){
                    return
                }
                // Request accounts (trigger MetaMask connect popup)
              
                console.log('metaMaskProvider', metaMaskProvider);
                // Get the signer
                // Wrap the provider with ethers.js Web3Provider
                const ethersProvider = new ethers.BrowserProvider(metaMaskProvider);
                const signer = await ethersProvider.getSigner();
                
                setSignerAddress(await signer.getAddress());

                _ctx.signers[0] = signer;
                

                console.log('Connected wallet address:', signerAddress);

            } else {
                console.error('Please install MetaMask!');
            }
        } catch (error) {
            console.error(error);
        }


    }
    function disconnectWallet() {
        setSignerAddress(""); // Clear the signer address
        
        _ctx.signers = _ctx.signers.filter((signer) => signer !== _ctx.signers[0]);
        console.log('Disconnected wallet.');
    }


    return (<button onClick={handleClick} style={{
        borderRadius: '0',
        alignSelf: "stretch",
    }}>{isConnected ? "disconnect" : "connect"}
        <div className="address">{signerAddress}</div>
    </button>)
}