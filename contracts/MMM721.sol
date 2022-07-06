// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./helpers/TokenSignature.sol";

contract MMM721 is
    ERC721Enumerable,
    ERC2981,
    ERC721URIStorage,
    TokenSignature,
    AccessControl
{
    using SafeERC20 for IERC20;
    using Strings for uint16;

    bytes32 public constant OWNER_ERC721_ROLE = keccak256("OWNER_ERC721_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    event RoyaltyChanged(address receiver, uint96 royaltyFeesInBips);
    event TokenRoyaltyChanged(
        uint256 tokenId,
        address receiver,
        uint96 royaltyFeesInBips
    );
    event SetTokenURI(uint256 tokenId, string _tokenURI);
    event Burn(uint256 tokenId);
    event SetMaxQuantity(uint16 newMaxQuantity);
    event ETHUnlocked(uint256 ethAmount);

    /// @dev Check if caller is minter

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter.");
        _;
    }

    /// @dev Check if caller is owner

    modifier onlyOwner() {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a owner.");
        _;
    }

    /// @dev Sets main dependencies and constants
    /// @param name 721 nft name
    /// @param symbol 721 nft symbol
    /// @param royaltyFeesInBips fee percent. 1% = 100 bips

    constructor(
        string memory name,
        string memory symbol,
        uint96 royaltyFeesInBips
    ) ERC721(name, symbol) {
        __Signature_init("Token", "1");
        _setupRole(OWNER_ERC721_ROLE, _msgSender());
        _setRoleAdmin(OWNER_ERC721_ROLE, OWNER_ERC721_ROLE);
        _setRoleAdmin(MINTER_ROLE, OWNER_ERC721_ROLE);
        _setupRole(MINTER_ROLE, _msgSender());
        setRoyaltyInfo(_msgSender(), royaltyFeesInBips);
    }

    /// Returns random number between 0 and max
    function getRandomNumber(uint128 seed, uint256 max)
        external
        view
        returns (uint256)
    {
        return
            uint256(
                keccak256(abi.encodePacked(block.timestamp, msg.sender, seed))
            ) % max;
    }

    /// @dev Return the token URI. Included baseUri concatenated with tokenUri
    /// @param tokenId Id of ERC721 token

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @dev Set the token URI
    /// @param tokenId Id of ERC721 token
    /// @param _tokenURI token URI without base URI

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        external
        onlyOwner
    {
        super._setTokenURI(tokenId, _tokenURI);
        emit SetTokenURI(tokenId, _tokenURI);
    }

    /// @dev Mint a new ERC721 token with incremented id and custom url
    /// @param uri token metadata

    function mint(
        string memory uri,
        uint256 tokenId,
        uint256 price,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable {
        require(msg.value == price, "Incorrectly amount by the user.");
        require(
            hasRole(
                MINTER_ROLE,
                _getSigner(msg.sender, tokenId, uri, msg.value, v, r, s)
            ),
            "Action is inconsistent."
        );
        _mint(msg.sender, tokenId, uri);
    }

    /// @dev Interanl mint a new ERC721 token with incremented id and custom url
    /// @param to token reciever after minting
    /// @param uri token metadata

    function _mint(
        address to,
        uint256 tokenId,
        string memory uri
    ) internal {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /// @dev burn a existing ERC721 token
    /// @param tokenId Id of ERC721 token

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        emit Burn(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /// @dev Sets the royalty information that all ids in this contract will default to.
    /// @param _receiver royalty reciever. Cannot be the zero address.
    /// @param _royaltyFeesInBips fee percent. 1% = 100 bips

    function setRoyaltyInfo(address _receiver, uint96 _royaltyFeesInBips)
        public
        onlyOwner
    {
        require(_royaltyFeesInBips <= 1000, "Royalty must be <= 10%");
        _setDefaultRoyalty(_receiver, _royaltyFeesInBips);
        emit RoyaltyChanged(_receiver, _royaltyFeesInBips);
    }

    /// @dev Sets the royalty for one of the token.
    /// @param _tokenId token id.
    /// @param _receiver royalty reciever. Cannot be the zero address.
    /// @param _royaltyFeesInBips fee percent. 1% = 100 bips

    function setTokenRoyalty(
        uint256 _tokenId,
        address _receiver,
        uint96 _royaltyFeesInBips
    ) public onlyOwner {
        require(_royaltyFeesInBips <= 1000, "Royalty must be <= 10%");
        _setTokenRoyalty(_tokenId, _receiver, _royaltyFeesInBips);

        emit TokenRoyaltyChanged(_tokenId, _receiver, _royaltyFeesInBips);
    }

    /// @dev Withdraw all ETH from contract to the contract owner

    function unlockETH() external onlyOwner {
        uint256 amt = address(this).balance;
        require(amt > 0, "Balance is zero.");
        payable(msg.sender).transfer(amt);
        emit ETHUnlocked(amt);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
