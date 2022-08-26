//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {
    //variables
    address payable public immutable feeReceiver; // the address which receives fees
    uint256 public immutable feePercent;
    uint256 public itemCount;

    //structs
    struct NftItem {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool sold;
    }

    //mapping
    mapping(uint256 => NftItem) public nftItems;

    //events
    event SellEvent(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller
    );

    event PurchasedEvent(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    constructor(uint256 _feePercent) {
        feeReceiver = payable(msg.sender);
        feePercent = _feePercent;
    }

    function SellNftItem(
        IERC721 _nft,
        uint256 _tokenId,
        uint256 _price
    ) external nonReentrant {
        require(_price > 0, "the price must be greater than zero");

        itemCount++;
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        nftItems[itemCount] = NftItem(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );

        emit SellEvent(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    function PurchaseNftItem(uint256 _itemId) external payable nonReentrant {
        uint256 _totalPrice = getTotalPrice(_itemId);
        NftItem storage item = nftItems[_itemId];
        console.log("sender value %s : ", msg.value);
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(
            msg.value >= _totalPrice,
            "not enough balance for buying this nft item"
        );
        require(!item.sold, "item already sold");

        feeReceiver.transfer(_totalPrice - item.price);
        item.seller.transfer(item.price);

        item.sold = true;

        item.nft.transferFrom(address(this), msg.sender, item.tokenId);

        emit PurchasedEvent(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    function getTotalPrice(uint256 _itemId) public view returns (uint256) {
        return ((nftItems[_itemId].price * (100 + feePercent)) / 100);
    }
}
