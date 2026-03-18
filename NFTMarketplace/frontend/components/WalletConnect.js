import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

export default function WalletConnect({ onConnect }) {
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAddress(accounts[0] || null);
        if (onConnect) onConnect(accounts[0] || null);
      });
    }
  }, []);

  async function connect() {
    const web3Modal = new Web3Modal({ cacheProvider: true });
    const instance = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    setAddress(addr);
    if (onConnect) onConnect(addr, provider, signer);
  }

  return address ? <div>Connected: {address}</div> : <button onClick={connect}>Connect Wallet</button>;
}