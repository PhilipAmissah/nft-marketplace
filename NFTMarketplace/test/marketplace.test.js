const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let nft, marketplace, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy("Demo", "DM", "https://base/");
    await nft.deployed();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(owner.address);
    await marketplace.deployed();

    // mint NFT to alice
    await nft.connect(owner).mint(alice.address, "ipfs://1", owner.address, 500);
    await nft.connect(alice).setApprovalForAll(marketplace.address, true);
  });

  it("lists and buys NFT", async function () {
    // alice lists token 1 for 1 ETH
    await marketplace.connect(alice).list(nft.address, 1, ethers.utils.parseEther("1"));

    // bob buys
    await marketplace.connect(bob).buy(nft.address, 1, { value: ethers.utils.parseEther("1") });

    // bob should be able to withdraw NFT from pending state? Actually NFT transferred immediately
    expect(await nft.ownerOf(1)).to.equal(bob.address);

    // check pending withdrawals for alice (seller proceeds)
    const pending = await marketplace.pendingWithdrawals(alice.address);
    expect(pending).to.be.gt(0);
  });

  it("creates auction and accepts bids", async function () {
    await marketplace.connect(alice).createAuction(nft.address, 1, ethers.utils.parseEther("0.1"), 60);
    await marketplace.connect(bob).bid(nft.address, 1, { value: ethers.utils.parseEther("0.2") });

    // advance time and settle
    await ethers.provider.send("evm_increaseTime", [70]);
    await ethers.provider.send("evm_mine");
    await marketplace.connect(owner).settleAuction(nft.address, 1);

    // winner should be bob
    expect(await nft.ownerOf(1)).to.equal(bob.address);
  });
});