import { ethers } from "hardhat";
import { expect } from "chai";

import {
  LSP7Tester__factory,
  LSP7InitTester__factory,
  LSP7DigitalAsset,
} from "../../types";

import {
  getNamedAccounts,
  shouldBehaveLikeLSP7,
  shouldInitializeLikeLSP7,
  LSP7TestContext,
} from "./LSP7DigitalAsset.behaviour";

import {
  LS4DigitalAssetMetadataTestContext,
  shouldBehaveLikeLSP4DigitalAssetMetadata,
} from "../LSP4DigitalAssetMetadata/LSP4DigitalAssetMetadata.behaviour";

import { deployProxy } from "../utils/fixtures";

describe("LSP7", () => {
  describe("when using LSP7 contract with constructor", () => {
    const buildTestContext = async (): Promise<LSP7TestContext> => {
      const accounts = await getNamedAccounts();
      const initialSupply = ethers.BigNumber.from("3");
      const deployParams = {
        name: "LSP7 - deployed with constructor",
        symbol: "Token",
        newOwner: accounts.owner.address,
      };

      const lsp7 = await new LSP7Tester__factory(accounts.owner).deploy(
        deployParams.name,
        deployParams.symbol,
        deployParams.newOwner
      );

      // mint tokens for the owner
      await lsp7.mint(accounts.owner.address, initialSupply, true, "0x");

      return { accounts, lsp7, deployParams, initialSupply };
    };

    const buildLSP4DigitalAssetMetadataTestContext =
      async (): Promise<LS4DigitalAssetMetadataTestContext> => {
        const { lsp7 } = await buildTestContext();
        let accounts = await ethers.getSigners();

        let deployParams = {
          owner: accounts[0],
        };

        return {
          contract: lsp7 as LSP7DigitalAsset,
          accounts,
          deployParams,
        };
      };

    describe("when deploying the contract", () => {
      it("should revert when deploying with address(0) as owner", async () => {
        const accounts = await ethers.getSigners();

        const deployParams = {
          name: "LSP7 - deployed with constructor",
          symbol: "Token",
          newOwner: ethers.constants.AddressZero,
        };

        await expect(
          new LSP7Tester__factory(accounts[0]).deploy(
            deployParams.name,
            deployParams.symbol,
            deployParams.newOwner
          )
        ).to.be.revertedWith(
          "Ownable: contract owner cannot be the zero address"
        );
      });

      describe("once the contract was deployed", () => {
        let context: LSP7TestContext;

        beforeEach(async () => {
          context = await buildTestContext();
        });

        shouldInitializeLikeLSP7(async () => {
          const { lsp7, deployParams } = context;
          return {
            lsp7,
            deployParams,
            initializeTransaction: context.lsp7.deployTransaction,
          };
        });
      });
    });

    describe("when testing deployed contract", () => {
      shouldBehaveLikeLSP4DigitalAssetMetadata(
        buildLSP4DigitalAssetMetadataTestContext
      );
      shouldBehaveLikeLSP7(buildTestContext);
    });
  });

  describe("when using LSP7 contract with proxy", () => {
    const buildTestContext = async (): Promise<LSP7TestContext> => {
      const accounts = await getNamedAccounts();
      const initialSupply = ethers.BigNumber.from("3");
      const deployParams = {
        name: "LSP7 - deployed with proxy",
        symbol: "TKN",
        newOwner: accounts.owner.address,
      };

      const lsp7TesterInit = await new LSP7InitTester__factory(
        accounts.owner
      ).deploy();

      const lsp7Proxy = await deployProxy(
        lsp7TesterInit.address,
        accounts.owner
      );

      const lsp7 = lsp7TesterInit.attach(lsp7Proxy);

      // mint tokens for the owner
      await lsp7.mint(accounts.owner.address, initialSupply, true, "0x");

      return { accounts, lsp7, deployParams, initialSupply };
    };

    const buildLSP4DigitalAssetMetadataTestContext =
      async (): Promise<LS4DigitalAssetMetadataTestContext> => {
        const { lsp7 } = await buildTestContext();
        let accounts = await ethers.getSigners();

        let deployParams = {
          owner: accounts[0],
        };

        return {
          contract: lsp7 as LSP7DigitalAsset,
          accounts,
          deployParams,
        };
      }

    const initializeProxy = async (context: LSP7TestContext) => {
      return context.lsp7["initialize(string,string,address,bool)"](
        context.deployParams.name,
        context.deployParams.symbol,
        context.deployParams.newOwner,
        false
      );
    };

    describe("when deploying the contract as proxy", () => {
      let context: LSP7TestContext;

      beforeEach(async () => {
        context = await buildTestContext();
      });

      it("should revert when initializing with address(0) as owner", async () => {
        await expect(
          context.lsp7["initialize(string,string,address,bool)"](
            context.deployParams.name,
            context.deployParams.symbol,
            ethers.constants.AddressZero,
            false
          )
        ).to.be.revertedWith(
          "Ownable: contract owner cannot be the zero address"
        );
      });

      describe("when initializing the contract", () => {
        shouldInitializeLikeLSP7(async () => {
          const { lsp7, deployParams } = context;
          const initializeTransaction = await initializeProxy(context);

          return {
            lsp7,
            deployParams,
            initializeTransaction,
          };
        });
      });

      describe("when calling initialize more than once", () => {
        it("should revert", async () => {
          await initializeProxy(context);

          await expect(initializeProxy(context)).to.be.revertedWith(
            "Initializable: contract is already initialized"
          );
        });
      });
    });

    describe("when testing deployed contract", () => {
      shouldBehaveLikeLSP4DigitalAssetMetadata(async () => {
        let lsp4Context = await buildLSP4DigitalAssetMetadataTestContext();
        
        await lsp4Context.contract["initialize(string,string,address,bool)"](
          "LSP7 - deployed with proxy",
          "TKN",
          lsp4Context.deployParams.owner.address,
          false
        )

        return lsp4Context;
      });

      shouldBehaveLikeLSP7(() =>
        buildTestContext().then(async (context) => {
          await initializeProxy(context);

          return context;
        })
      );
    });
  });
});
