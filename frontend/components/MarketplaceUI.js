import { useState, useEffect } from "react";
import { MARKET_ABI, MARKET_ADDRESS, NFT_ABI, NFT_ADDRESS } from "../lib/contracts";
import { ethers } from "ethers";

export default function MarketplaceUI({ provider, signer, user }) {
  const [listings, setListings] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [nftContract, setNftContract] = useState(null);
  const [marketContract, setMarketContract] = useState(null);

  useEffect(() => {
    if (provider) {
      const nft = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
      const market = new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, provider);
      setNftContract(nft);
      setMarketContract(market);
    }
  }, [provider]);

  // For demo, assume some listings/auctions are known or fetched via events, but since no backend, skeleton
  // In real app, use The Graph or events to fetch

  async function listNFT(tokenId, price) {
    if (!signer) return;
    const market = new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, signer);
    const tx = await market.list(NFT_ADDRESS, tokenId, ethers.utils.parseEther(price));
    await tx.wait();
    alert("Listed");
  }

  async function buyNFT(tokenId, price) {
    if (!signer) return;
    const market = new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, signer);
    const tx = await market.buy(NFT_ADDRESS, tokenId, { value: ethers.utils.parseEther(price) });
    await tx.wait();
    alert("Bought");
  }

  // Similar for auctions

  return (
    <div>
      <h2>Marketplace</h2>
      <div>
        <h3>List Your NFT</h3>
        <input id="listTokenId" placeholder="Token ID" />
        <input id="listPrice" placeholder="Price in ETH" />
        <button onClick={() => listNFT(document.getElementById('listTokenId').value, document.getElementById('listPrice').value)}>List</button>
      </div>
      <div>
        <h3>Buy NFT</h3>
        <input id="buyTokenId" placeholder="Token ID" />
        <input id="buyPrice" placeholder="Price in ETH" />
        <button onClick={() => buyNFT(document.getElementById('buyTokenId').value, document.getElementById('buyPrice').value)}>Buy</button>
      </div>
      {/* Display listings and auctions would require fetching data */}
    </div>
  );
}