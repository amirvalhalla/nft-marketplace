const { ethers } = require("hardhat");
const fromWei = (num) => ethers.utils.formatEther(num);

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await deployer.getBalance();
  console.log("Contract Deployer address: ", deployer.address);
  console.log("Deployer Balance: ", fromWei(deployerBalance));

  const Nft = await ethers.getContractFactory("NFT");
  const nft = await Nft.deploy();

  const feePercent = 1;
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(feePercent);

  console.log("Nft Contract address: " + nft.address);
  console.log("Marketplace Contract address: " + marketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
