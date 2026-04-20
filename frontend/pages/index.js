import WalletConnect from "../components/WalletConnect";
import MarketplaceUI from "../components/MarketplaceUI";
import { useState } from "react";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [user, setUser] = useState(null);

  function onConnect(addr, prov, s) {
    setUser(addr);
    setProvider(prov);
    setSigner(s);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>NFT Marketplace</h1>
      <WalletConnect onConnect={onConnect} />
      <MarketplaceUI provider={provider} signer={signer} user={user} />
    </div>
  );
}