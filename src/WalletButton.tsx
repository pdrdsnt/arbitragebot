import { useContext, useEffect, useState } from "react"
import { ctx } from "./App"
import { ethers } from "ethers"
export default function WalletButton() 
{
    const _ctx = useContext(ctx);
    const [isConnected, setConnect] = useState(false)
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
                let ethProvider = window.ethereum;
                
                if (window.ethereum.providers) {
                    console.log('Multiple providers found:', window.ethereum.providers);
                    for (const provider of window.ethereum.providers) {
                        try {
                            ethProvider = provider
                            break
                        } catch {
                            console.log('Connection request canceled for a provider.');
                            setConnect(false)
                            continue
                        }
                    }
                }
                if (!ethProvider) {
                    return
                }
                // Request accounts (trigger MetaMask connect popup)

                console.log('ethProvider', ethProvider);
                // Get the signer
                // Wrap the provider with ethers.js Web3Provider
                const ethersProvider = new ethers.BrowserProvider(ethProvider);
                const signer = await ethersProvider.getSigner();

                setSignerAddress(await signer.getAddress());

                _ctx.signers[0] = signer;
                _ctx.wallets[0] = ethersProvider;

                console.log('Connected wallet address:', signerAddress);

            } else {
                console.error('Please install MetaMask!');
            }
        } catch (error) {
            console.error(error);
        }


    }
    function disconnectWallet() {
        // Clear the signer address
        setSignerAddress("");

        // Clear any app-side signers or wallets
        _ctx.signers = [];
        _ctx.wallets = [];
        
        console.log("Disconnected wallet. Please disconnect it from your wallet app if needed.");
    }


    return (<button onClick={handleClick} style={{
        borderRadius: '0',
        alignSelf: "stretch",
    }}>{isConnected ? "disconnect" : "connect"}
        <div className="address">{signerAddress}</div>
    </button>)
}