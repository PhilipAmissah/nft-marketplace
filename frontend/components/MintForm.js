import { useState } from "react";
import { NFT_ABI, NFT_ADDRESS } from "../lib/contracts";
import { ethers } from "ethers";

export default function MintForm({ signer }) {
  const [to, setTo] = useState("");
  const [uri, setUri] = useState("");

  async function mint() {
    if (!signer) return alert("connect wallet");
    const contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);
    const tx = await contract.mint(to, uri, await signer.getAddress(), 500); // example royalty 5%
    await tx.wait();
    alert("Minted");
  }

  return (
    <div>
      <h2>Mint NFT</h2>
      <input placeholder="recipient" value={to} onChange={(e)=>setTo(e.target.value)} />
      <input placeholder="tokenURI" value={uri} onChange={(e)=>setUri(e.target.value)} />
      <button onClick={mint}>Mint</button>
    </div>
  );
}