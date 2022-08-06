const { expect, assert } = require("chai");
const { ethers, network } = require("hardhat");
const { signDataByUser } = require("./helpers/sign");

const tokenName = "MMMToken";
const tokenSymbol = "MMM";
const metadata =
  "QmP5Aq9xnduntChzojeRTGuPngcC3J33hsmSJgw95UV6G2/Hamster_1.json";
const url = "https://ipfs.io/ipfs/";

const ownerRole = ethers.utils.id("OWNER_ERC721_ROLE");
let accounts;
let owner;
let user1;
let user2;
let token;
let domainToken;

describe("MMM_NFT 721", function () {
  before("deploy token", async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    const Contract = await ethers.getContractFactory("MMM721");
    token = await Contract.connect(owner).deploy(
      tokenName,
      tokenSymbol,
      100,
      url
    );
    await token.deployed();

    domainToken = {
      name: "Token",
      version: "1",
      chainId: network.config.chainId,
      verifyingContract: token.address,
    };
  });
  describe("Mint", function () {
    it("Mint without signature", async function () {
      const amount = ethers.utils.parseEther("2");
      const signature = await signDataByUser(
        domainToken,
        user1.address,
        0,
        metadata,
        amount,
        user1
      );

      await expect(
        token
          .connect(user1)
          .mint(metadata, 0, amount, signature.v, signature.r, signature.s, {
            gasLimit: 3000000,
            value: amount,
          })
      ).to.be.revertedWith("Action is inconsistent.");
    });

    it("Mint with signature but incorrect amount", async function () {
      const amount = ethers.utils.parseEther("2");
      const signature = await signDataByUser(
        domainToken,
        user1.address,
        0,
        metadata,
        amount,
        owner
      );

      await expect(
        token
          .connect(user1)
          .mint(metadata, 0, amount, signature.v, signature.r, signature.s, {
            gasLimit: 3000000,
            value: ethers.utils.parseEther("1"),
          })
      ).to.be.revertedWith("Incorrectly amount by the user.");
    });

    it("Mint with signature", async function () {
      const amount = ethers.utils.parseEther("2");
      const signature = await signDataByUser(
        domainToken,
        user1.address,
        0,
        metadata,
        amount,
        owner
      );

      await token
        .connect(user1)
        .mint(metadata, 0, amount, signature.v, signature.r, signature.s, {
          gasLimit: 3000000,
          value: amount,
        });

      assert.equal(await token.tokenURI(0), url + metadata);
    });

    it("Mint with the same signature", async function () {
      const amount = ethers.utils.parseEther("2");
      const signature = await signDataByUser(
        domainToken,
        user1.address,
        0,
        metadata,
        amount,
        owner
      );

      await expect(
        token
          .connect(user1)
          .mint(metadata, 0, amount, signature.v, signature.r, signature.s, {
            gasLimit: 3000000,
            value: amount,
          })
      ).to.revertedWith("ERC721: token already minted");
    });

    it("Mint with the same signature but another tokenId", async function () {
      const amount = ethers.utils.parseEther("2");
      const signature = await signDataByUser(
        domainToken,
        user1.address,
        0,
        metadata,
        amount,
        owner
      );

      await expect(
        token
          .connect(user1)
          .mint(metadata, 1, amount, signature.v, signature.r, signature.s, {
            gasLimit: 3000000,
            value: amount,
          })
      ).to.revertedWith("Action is inconsistent.");
    });
  });
  describe("getRandom", function () {
    it("getRandomNumber", async function () {
      const randomBack = Math.floor(Math.random() * 10000000000);
      console.log(await token.getRandomNumber(randomBack, 10000));
      console.log(await token.getRandomNumber(randomBack, 10000));
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      console.log(await token.getRandomNumber(randomBack, 10000));
    });
    it("getRandomNumber with new back random", async function () {
      const randomBack = Math.floor(Math.random() * 10000000000);
      console.log(await token.getRandomNumber(randomBack, 10000));
    });
  });

  describe("unlockETH", function () {
    it("Unlock ETH", async function () {
      const tx = await token.unlockETH();

      const receipt = await tx.wait();

      const resEvent = receipt.events?.filter((x) => {
        return x.event === "ETHUnlocked";
      });
      const amt = resEvent[0].args.ethAmount;
      assert.equal(amt, "2000000000000000000");
    });

    it("try to Unlock ETH one more time", async function () {
      await expect(token.unlockETH()).to.revertedWith("Balance is zero.");
    });
  });

  describe("AccessControl", function () {
    it("grand owner role", async function () {
      assert.isTrue(await token.hasRole(ownerRole, owner.address));
      await token.connect(owner).grantRole(ownerRole, user2.address);
      assert.isTrue(await token.hasRole(ownerRole, owner.address));
      assert.isTrue(await token.hasRole(ownerRole, user2.address));
    });

    it("revoke owner role", async function () {
      assert.isTrue(await token.hasRole(ownerRole, owner.address));
      await token.connect(owner).revokeRole(ownerRole, owner.address);
      assert.isFalse(await token.hasRole(ownerRole, owner.address));
      assert.isTrue(await token.hasRole(ownerRole, user2.address));
    });
  });

  describe("Royalty", function () {
    it("Should return royalty information set at contract deploying", async function () {
      const tokenId = 1;
      const salePrice = 10000;
      const royaltyInfo = await token
        .connect(owner)
        .royaltyInfo(tokenId, salePrice);
      assert.equal(royaltyInfo[1], "100");
    });

    it("Should posible to set new royalty values", async function () {
      const tokenId = 1;
      const salePrice = 10000;
      const royaltyFeeInBeeps = 900;
      await token
        .connect(user2)
        .setRoyaltyInfo(user2.address, royaltyFeeInBeeps, {
          gasLimit: 3000000,
        });
      const royaltyInfo = await token
        .connect(user2)
        .royaltyInfo(tokenId, salePrice);
      assert.equal(royaltyInfo[1], "900");
    });

    it("Should not posible to set new royalty values by not owner", async function () {
      const tokenId = 1;
      const salePrice = 10000;
      const royaltyFeeInBeeps = 990;
      await expect(
        token.connect(user1).setRoyaltyInfo(owner.address, royaltyFeeInBeeps, {
          gasLimit: 3000000,
        })
      ).to.be.revertedWith("Caller is not a owner.");
      const royaltyInfo = await token
        .connect(owner)
        .royaltyInfo(tokenId, salePrice);
      assert.equal(royaltyInfo[1], "900");
    });

    it("Should posible to set new royalty values for token", async function () {
      const tokenId = 2;
      const salePrice = 10000;
      const royaltyFeeInBeeps = 500;
      await token
        .connect(user2)
        .setTokenRoyalty(tokenId, owner.address, royaltyFeeInBeeps, {
          gasLimit: 3000000,
        });
      const royaltyInfo = await token
        .connect(owner)
        .royaltyInfo(tokenId, salePrice);
      assert.equal(royaltyInfo[1], "500");
    });

    it("Should posible to set new royalty values", async function () {
      const tokenId = 1;
      const salePrice = 10000;
      const royaltyFeeInBeeps = 1000;
      await token
        .connect(user2)
        .setRoyaltyInfo(user2.address, royaltyFeeInBeeps, {
          gasLimit: 3000000,
        });
      const royaltyInfo = await token
        .connect(user2)
        .royaltyInfo(tokenId, salePrice);
      assert.equal(royaltyInfo[1], "1000");
    });

    it("The default value should be kept", async function () {
      const tokenId = 0;
      const salePrice = 10000;
      const royaltyInfo = await token
        .connect(owner)
        .royaltyInfo(tokenId, salePrice);
      assert.equal(royaltyInfo[1], "1000");
    });
  });

  describe("Burn", function () {
    before("mint tokens", async function () {
      const amount = ethers.utils.parseEther("2");
      let signature = await signDataByUser(
        domainToken,
        user1.address,
        1,
        metadata,
        amount,
        owner
      );

      await token
        .connect(user1)
        .mint(metadata, 1, amount, signature.v, signature.r, signature.s, {
          gasLimit: 3000000,
          value: amount,
        });

      signature = await signDataByUser(
        domainToken,
        user1.address,
        2,
        metadata,
        amount,
        owner
      );

      await token
        .connect(user1)
        .mint(metadata, 2, amount, signature.v, signature.r, signature.s, {
          gasLimit: 3000000,
          value: amount,
        });
    });

    it("burn by not admin", async function () {
      await expect(token.connect(user1).burn(1)).to.be.revertedWith(
        "Caller is not a owner."
      );
    });

    it("burn by admin", async function () {
      assert.equal(await token.ownerOf(1), user1.address);
      assert.equal(await token.ownerOf(2), user1.address);
      await token.connect(user2).burn(1);
      await token.connect(user2).burn(2);

      await expect(token.ownerOf(1)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
      await expect(token.ownerOf(2)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });
  });
});
