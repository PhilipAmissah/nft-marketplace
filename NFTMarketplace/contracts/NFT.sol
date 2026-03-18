// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title NFT - ERC721 with EIP-2981 royalties and owner minting
contract NFT is ERC721, ERC2981, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string public baseURI;
    mapping(uint256 => string) private _tokenURIs;

    event Minted(address indexed to, uint256 tokenId, string uri);

    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) {
        baseURI = baseURI_;
    }

    /// @notice Mint a new token to `to` with `tokenURI` and set royalty (feeNumerator in basis points)
    function mint(address to, string calldata tokenURI_, address royaltyReceiver, uint96 feeNumerator) external onlyOwner returns (uint256) {
        _tokenIdCounter.increment();
        uint256 id = _tokenIdCounter.current();
        _safeMint(to, id);
        _setTokenURI(id, tokenURI_);
        if (royaltyReceiver != address(0) && feeNumerator > 0) {
            _setTokenRoyalty(id, royaltyReceiver, feeNumerator);
        }
        emit Minted(to, id, tokenURI_);
        return id;
    }

    function _setTokenURI(uint256 tokenId, string calldata uri) internal {
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "nonexistent");
        string memory _uri = _tokenURIs[tokenId];
        if (bytes(_uri).length > 0) return _uri;
        return baseURI;
    }

    /// @notice Owner can set default royalty for all tokens
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /// @notice Owner can delete default royalty
    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}