const hre = require("hardhat");

const tokenName = "TestS";
const tokenSymbol = "TSTN";
const url = "https://ipfs.io/ipfs/";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.MMM_CONTRACT,
    constructorArguments: [tokenName, tokenSymbol, 1000, url],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
