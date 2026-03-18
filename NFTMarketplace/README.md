# NFT Marketplace

NFT Marketplace (EVM) starter project.

## Features

- **ERC-721 minting contract** with EIP-2981 royalty support and mint access control.
- **Marketplace contract** supporting fixed-price listings, English auctions (bids), secure transfers, and gas-efficient accounting.
- **Security**: ReentrancyGuard, pull-payment pattern for refunds, checks for approvals, and owner/timelock notes.
- **Frontend**: Next.js + ethers.js wallet authentication, mint UI, list/bid/buy UI components, and optimistic UX.
- **Testing & CI**: Hardhat tests, local deploy script, and README instructions for demoing on localhost and pushing to GitHub.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

2. Compile contracts:
   ```bash
   npx hardhat compile
   ```

3. Run tests:
   ```bash
   npx hardhat test
   ```

4. Start local node:
   ```bash
   npx hardhat node
   ```

5. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

6. Start frontend:
   ```bash
   cd frontend
   NEXT_PUBLIC_NFT_ADDRESS=<deployed_nft_address> NEXT_PUBLIC_MARKET_ADDRESS=<deployed_market_address> npm run dev
   ```

## Security Notes

- Royalty routing not implemented in marketplace MVP; query `royaltyInfo` and route payments on sale/settlement for production.
- Admin functions should be behind a timelock in production.
- Audit recommended before mainnet deployment.

## Demo

Mint an NFT on `/mint`, list it, buy it, or create an auction.