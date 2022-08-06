require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.15",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 3000000000000,
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEV_KEY],
      gasPrice: 2500000000,
      gasMultiplier: 1,
      chainId: 4,
    },
    matic: {
      url: "https://rpc-mainnet.matic.quiknode.pro",
      chainId: 137,
      accounts: [process.env.PRIVATE_KEY],
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      gasPrice: 4300000000,
      accounts: [process.env.PRIVATE_KEY],
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      chainId: 31337,
      gasPrice: 3000000000,
      gasMultiplier: 1,
    },
    hardhat: {
      accounts: {
        count: 10,
      },
    },
  },
  etherscan: {
    apiKey: process.env.MATICSCAN_API_KEY,
  },
};
