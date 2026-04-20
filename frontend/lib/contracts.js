import NFTABI from '../../artifacts/contracts/NFT.sol/NFT.json';
import MarketplaceABI from '../../artifacts/contracts/Marketplace.sol/Marketplace.json';

export const NFT_ABI = NFTABI.abi;
export const MARKET_ABI = MarketplaceABI.abi;

// Replace with deployed addresses after running deploy script
export const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const MARKET_ADDRESS = process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0x0000000000000000000000000000000000000000";