const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy("DemoNFT", "DNFT", "https://example.com/metadata/");
  await nft.deployed();

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.deployed();

  console.log("NFT:", nft.address);
  console.log("Marketplace:", marketplace.address);

  // Mint some NFTs
  await nft.mint(deployer.address, "ipfs://Qm1", deployer.address, 500);
  await nft.mint(deployer.address, "ipfs://Qm2", deployer.address, 500);
  console.log("Minted tokens 1 and 2");

  // Approve marketplace
  await nft.setApprovalForAll(marketplace.address, true);

  // List one
  await marketplace.list(nft.address, 1, hre.ethers.utils.parseEther("1"));
  console.log("Listed token 1 for 1 ETH");
}

main().catch((e) => { console.error(e); process.exit(1); });