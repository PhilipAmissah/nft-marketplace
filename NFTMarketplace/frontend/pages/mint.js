import { useState } from "react";
import WalletConnect from "../components/WalletConnect";
import MintForm from "../components/MintForm";

export default function MintPage() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  function onConnect(addr, prov, s) {
    setProvider(prov);
    setSigner(s);
  }

  return (
    <div>
      <WalletConnect onConnect={onConnect} />
      <MintForm signer={signer} />
    </div>
  );
}