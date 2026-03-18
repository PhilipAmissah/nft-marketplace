// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Marketplace - fixed price listings and English auctions for ERC721
contract Marketplace is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 price; // wei for fixed-price
        bool active;
    }

    struct Auction {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endAt;
        bool settled;
    }

    // marketplace state
    uint256 public platformFeeBps = 250; // 2.5%
    address public feeRecipient;

    // storage
    mapping(address => mapping(uint256 => Listing)) public listings; // nft => tokenId => Listing
    mapping(address => mapping(uint256 => Auction)) public auctions; // nft => tokenId => Auction
    mapping(address => uint256) public pendingWithdrawals; // for refunds and seller proceeds

    event Listed(address indexed seller, address indexed nft, uint256 indexed tokenId, uint256 price);
    event Cancelled(address indexed seller, address indexed nft, uint256 indexed tokenId);
    event Bought(address indexed buyer, address indexed nft, uint256 indexed tokenId, uint256 price);
    event AuctionCreated(address indexed seller, address indexed nft, uint256 indexed tokenId, uint256 minBid, uint256 endAt);
    event BidPlaced(address indexed bidder, address indexed nft, uint256 indexed tokenId, uint256 amount);
    event AuctionSettled(address indexed seller, address indexed nft, uint256 indexed tokenId, address winner, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    /// @notice List an ERC721 token for fixed price sale. Caller must approve marketplace.
    function list(address nft, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "price>0");
        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "not owner");
        require(token.getApproved(tokenId) == address(this) || token.isApprovedForAll(msg.sender, address(this)), "not approved");

        listings[nft][tokenId] = Listing({seller: msg.sender, nft: nft, tokenId: tokenId, price: price, active: true});
        emit Listed(msg.sender, nft, tokenId, price);
    }

    /// @notice Cancel a listing
    function cancelListing(address nft, uint256 tokenId) external nonReentrant {
        Listing storage l = listings[nft][tokenId];
        require(l.active, "not active");
        require(l.seller == msg.sender, "not seller");
        l.active = false;
        emit Cancelled(msg.sender, nft, tokenId);
    }

    /// @notice Buy a listed NFT. Transfers NFT to buyer and credits seller minus fees.
    function buy(address nft, uint256 tokenId) external payable nonReentrant {
        Listing storage l = listings[nft][tokenId];
        require(l.active, "not listed");
        require(msg.value == l.price, "wrong value");

        l.active = false;

        // compute fees
        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 sellerProceeds = msg.value - fee;

        // credit pending withdrawals
        pendingWithdrawals[feeRecipient] += fee;
        pendingWithdrawals[l.seller] += sellerProceeds;

        // transfer NFT
        IERC721(nft).safeTransferFrom(l.seller, msg.sender, tokenId);

        emit Bought(msg.sender, nft, tokenId, msg.value);
    }

    /// @notice Create an English auction. Seller must approve marketplace.
    function createAuction(address nft, uint256 tokenId, uint256 minBid, uint256 durationSeconds) external nonReentrant {
        require(minBid > 0, "minBid>0");
        IERC721 token = IERC721(nft);
        require(token.ownerOf(tokenId) == msg.sender, "not owner");
        require(token.getApproved(tokenId) == address(this) || token.isApprovedForAll(msg.sender, address(this)), "not approved");

        uint256 endAt = block.timestamp + durationSeconds;
        auctions[nft][tokenId] = Auction({
            seller: msg.sender,
            nft: nft,
            tokenId: tokenId,
            minBid: minBid,
            highestBid: 0,
            highestBidder: address(0),
            endAt: endAt,
            settled: false
        });

        emit AuctionCreated(msg.sender, nft, tokenId, minBid, endAt);
    }

    /// @notice Place a bid on an auction. ETH bids only for MVP.
    function bid(address nft, uint256 tokenId) external payable nonReentrant {
        Auction storage a = auctions[nft][tokenId];
        require(a.endAt > 0 && block.timestamp < a.endAt, "no active auction");
        uint256 newBid = msg.value;
        uint256 minAccept = a.highestBid == 0 ? a.minBid : a.highestBid + ((a.highestBid * 5) / 100); // 5% min increment
        require(newBid >= minAccept, "bid too low");

        // refund previous highest bidder via pendingWithdrawals (pull pattern)
        if (a.highestBidder != address(0)) {
            pendingWithdrawals[a.highestBidder] += a.highestBid;
        }

        a.highestBid = newBid;
        a.highestBidder = msg.sender;

        emit BidPlaced(msg.sender, nft, tokenId, newBid);
    }

    /// @notice Settle an auction after it ends. Transfers NFT to winner and credits seller minus fees.
    function settleAuction(address nft, uint256 tokenId) external nonReentrant {
        Auction storage a = auctions[nft][tokenId];
        require(a.endAt > 0 && block.timestamp >= a.endAt, "not ended");
        require(!a.settled, "already settled");
        a.settled = true;

        if (a.highestBidder == address(0)) {
            // no bids, nothing to do
            return;
        }

        uint256 fee = (a.highestBid * platformFeeBps) / 10000;
        uint256 sellerProceeds = a.highestBid - fee;
        pendingWithdrawals[feeRecipient] += fee;
        pendingWithdrawals[a.seller] += sellerProceeds;

        // transfer NFT to winner
        IERC721(a.nft).safeTransferFrom(a.seller, a.highestBidder, tokenId);

        emit AuctionSettled(a.seller, nft, tokenId, a.highestBidder, a.highestBid);
    }

    /// @notice Withdraw pending ETH (seller proceeds or refunds)
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "no funds");
        pendingWithdrawals[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Admin: update platform fee recipient and bps
    function setPlatformFee(uint256 bps, address recipient) external onlyOwner {
        require(bps <= 2000, "max 20%"); // safety cap
        platformFeeBps = bps;
        feeRecipient = recipient;
    }

    // Allow contract to receive ETH for auctions
    receive() external payable {}
}