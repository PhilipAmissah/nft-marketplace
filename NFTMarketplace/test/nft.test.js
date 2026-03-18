const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT", function () {
  it("mints and supports royalties", async function () {
    const [owner, alice] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy("Demo", "DM", "https://base/");
    await nft.deployed();

    await nft.mint(alice.address, "ipfs://Qm...", owner.address, 500); // 5%
    expect(await nft.ownerOf(1)).to.equal(alice.address);

    const royalty = await nft.royaltyInfo(1, ethers.utils.parseEther("1"));
    expect(royalty[0]).to.equal(owner.address);
  });
});