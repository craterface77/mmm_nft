const { ethers } = require("hardhat");

const TokenType = {
  SignData: [
    { name: "buyer", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "uri", type: "string" },
    { name: "price", type: "uint256" },
  ],
};

const signDataByUser = async (domain, buyer, tokenId, uri, price, user) =>
  ethers.utils.splitSignature(
    await user._signTypedData(domain, TokenType, {
      buyer,
      tokenId,
      uri,
      price,
    })
  );

module.exports = { signDataByUser };
