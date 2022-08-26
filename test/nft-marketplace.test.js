const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFT Marketplace", function () {
  let deployer,
    addr1,
    addr2,
    addrs,
    Nft,
    nft,
    Marketplace,
    marketplace,
    tokenURI =
      "ipfs://bafkreidentviy7kshlwx7uwn7qubjgfdrn2zhc5vywzrbceqsqx4mevbiu",
    feePercent = 1;

  beforeEach(async () => {
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    Nft = await ethers.getContractFactory("NFT");
    nft = await Nft.deploy();

    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(feePercent);
  });

  describe("Deployment", () => {
    it("should track name and symbol of NFT", async () => {
      const name = await nft.name();
      const symbol = await nft.symbol();

      expect(name).to.equal("AHB NFT");
      expect(symbol).to.equal("AHBNFT");
    });

    it("should track feeAccount and feePercent for Marketplace", async () => {
      const feeReceiver = await marketplace.feeReceiver();
      const feePercent = await marketplace.feePercent();

      expect(feeReceiver).to.equal(deployer.address);
      expect(feePercent).to.equal(feePercent);
    });
  });

  describe("Mint NFT", () => {
    it("should track each minted Nft", async () => {
      await nft.connect(addr1).mint(tokenURI);

      //address 1
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);

      //address2
      await nft.connect(addr2).mint(tokenURI);

      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(tokenURI);
    });
  });

  describe("listing(sell) Nft Item into marketplace", () => {
    let price = 1;

    beforeEach(async () => {
      await nft.connect(addr1).mint(tokenURI);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });

    it("should track new NftItem for sell", async () => {
      await expect(
        marketplace.connect(addr1).SellNftItem(nft.address, 1, toWei(price))
      )
        .to.emit(marketplace, "SellEvent")
        .withArgs(1, nft.address, 1, toWei(price), addr1.address);

      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      expect(await marketplace.itemCount()).to.equal(1);

      const nftItem = await marketplace.nftItems(1);
      expect(nftItem.itemId).to.equal(1);
      expect(nftItem.nft).to.equal(nft.address);
      expect(nftItem.tokenId).to.equal(1);
      expect(nftItem.price).to.equal(toWei(price));
      expect(nftItem.sold).to.equal(false);
    });

    it("should fail if price be zero", async () => {
      await expect(
        marketplace.connect(addr1).SellNftItem(nft.address, 1, 0)
      ).to.be.revertedWith("the price must be greater than zero");
    });
  });

  describe("purchase Nft Item from Marketplace", () => {
    let price = 2;
    let fee = (feePercent / 100) * price;
    let totalPriceInWei;

    beforeEach(async () => {
      await nft.connect(addr1).mint(tokenURI);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
      await marketplace
        .connect(addr1)
        .SellNftItem(nft.address, 1, toWei(price));
    });

    it("should purchase Nft item", async () => {
      const sellerInitialBalance = await addr1.getBalance();
      const feeReceiverInitialBalance = await deployer.getBalance();

      totalPriceInWei = await marketplace.getTotalPrice(1);

      await expect(
        marketplace
          .connect(addr2)
          .PurchaseNftItem(1, { value: totalPriceInWei })
      )
        .to.emit(marketplace, "PurchasedEvent")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        );

      const sellerFinalBalance = await addr1.getBalance();
      const feeReceiverFinalBalance = await deployer.getBalance();

      expect((await marketplace.nftItems(1)).sold).to.equal(true);
      expect(+fromWei(sellerFinalBalance)).to.equal(
        +price + +fromWei(sellerInitialBalance)
      );
      expect(+fromWei(feeReceiverFinalBalance)).to.equal(
        +fee + +fromWei(feeReceiverInitialBalance)
      );
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should fail purchase", async function () {
      await expect(
        marketplace
          .connect(addr2)
          .PurchaseNftItem(2, { value: totalPriceInWei })
      ).to.be.revertedWith("item doesn't exist");
      await expect(
        marketplace
          .connect(addr2)
          .PurchaseNftItem(0, { value: totalPriceInWei })
      ).to.be.revertedWith("item doesn't exist");

      await expect(
        marketplace.connect(addr2).PurchaseNftItem(1, { value: toWei(price) })
      ).to.be.revertedWith("not enough balance for buying this nft item");
      await marketplace
        .connect(addr2)
        .PurchaseNftItem(1, { value: totalPriceInWei });
      const addr3 = addrs[0];
      await expect(
        marketplace
          .connect(addr3)
          .PurchaseNftItem(1, { value: totalPriceInWei })
      ).to.be.revertedWith("item already sold");
    });
  });
});
