const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with", deployer.address);

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy("DemoNFT", "DNFT", "https://example.com/metadata/");
  await nft.deployed();

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.deployed();

  console.log("NFT:", nft.address);
  console.log("Marketplace:", marketplace.address);
}

main().catch((e) => { console.error(e); process.exit(1); });