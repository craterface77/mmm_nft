const hre = require("hardhat");

const tokenName = "TestS";
const tokenSymbol = "TSTN";

async function main() {
  const Stone = await hre.ethers.getContractFactory("MMM721");
  const stone = await Stone.deploy(tokenName, tokenSymbol, 1000);

  await stone.deployed();

  console.log("ERC721 deployed to:", stone.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
