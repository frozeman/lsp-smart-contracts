import { ethers } from "hardhat";
import { expect } from "chai";

import {
  LSP7CompatibleERC20Tester__factory,
  LSP7CompatibleERC20InitTester__factory,
} from "../../../types";

import {
  getNamedAccounts,
  LSP7CompatibleERC20TestContext,
  shouldInitializeLikeLSP7CompatibleERC20,
  shouldBehaveLikeLSP7CompatibleERC20,
} from "./LSP7CompatibleERC20.behaviour";

import { deployProxy } from "../../utils/fixtures";

describe("LSP7CompatibleERC20", () => {
  describe("when using LSP7 contract with constructor", () => {
    const buildTestContext =
      async (): Promise<LSP7CompatibleERC20TestContext> => {
        const accounts = await getNamedAccounts();
        const initialSupply = ethers.BigNumber.from("3");
        const deployParams = {
          name: "Compat for ERC20",
          symbol: "NFT",
          newOwner: accounts.owner.address,
        };

        const lsp7CompatibleERC20 =
          await new LSP7CompatibleERC20Tester__factory(accounts.owner).deploy(
            deployParams.name,
            deployParams.symbol,
            deployParams.newOwner
          );

        return {
          accounts,
          lsp7CompatibleERC20,
          deployParams,
          initialSupply,
        };
      };

    describe("when deploying the contract", () => {
      let context: LSP7CompatibleERC20TestContext;

      beforeEach(async () => {
        context = await buildTestContext();
      });

      describe("when initializing the contract", () => {
        shouldInitializeLikeLSP7CompatibleERC20(async () => {
          const { lsp7CompatibleERC20, deployParams } = context;
          return {
            lsp7CompatibleERC20,
            deployParams,
            initializeTransaction:
              context.lsp7CompatibleERC20.deployTransaction,
          };
        });
      });
    });

    describe("when testing deployed contract", () => {
      shouldBehaveLikeLSP7CompatibleERC20(buildTestContext);
    });
  });

  describe("when using LSP7 contract with proxy", () => {
    const buildTestContext =
      async (): Promise<LSP7CompatibleERC20TestContext> => {
        const accounts = await getNamedAccounts();
        const initialSupply = ethers.BigNumber.from("3");
        const deployParams = {
          name: "LSP7 - deployed with constructor",
          symbol: "NFT",
          newOwner: accounts.owner.address,
        };

        const lsp7CompatibilityForERC20TesterInit =
          await new LSP7CompatibleERC20InitTester__factory(
            accounts.owner
          ).deploy();
        const lsp7CompatibilityForERC20Proxy = await deployProxy(
          lsp7CompatibilityForERC20TesterInit.address,
          accounts.owner
        );
        const lsp7CompatibleERC20 = lsp7CompatibilityForERC20TesterInit.attach(
          lsp7CompatibilityForERC20Proxy
        );

        return {
          accounts,
          lsp7CompatibleERC20,
          deployParams,
          initialSupply,
        };
      };

    const initializeProxy = async (context: LSP7CompatibleERC20TestContext) => {
      return context.lsp7CompatibleERC20["initialize(string,string,address)"](
        context.deployParams.name,
        context.deployParams.symbol,
        context.deployParams.newOwner
      );
    };

    describe("when deploying the base implementation contract", () => {
      it("prevent any address from calling the initialize(...) function on the implementation", async () => {
        const accounts = await ethers.getSigners();

        const lsp7CompatibilityForERC20TesterInit =
          await new LSP7CompatibleERC20InitTester__factory(
            accounts[0]
          ).deploy();

        const randomCaller = accounts[1];

        await expect(
          lsp7CompatibilityForERC20TesterInit[
            "initialize(string,string,address)"
          ]("XXXXXXXXXXX", "XXX", randomCaller.address)
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("when deploying the contract as proxy", () => {
      let context: LSP7CompatibleERC20TestContext;

      beforeEach(async () => {
        context = await buildTestContext();
      });

      describe("when initializing the contract", () => {
        shouldInitializeLikeLSP7CompatibleERC20(async () => {
          const { lsp7CompatibleERC20, deployParams } = context;
          const initializeTransaction = await initializeProxy(context);

          return {
            lsp7CompatibleERC20,
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
      shouldBehaveLikeLSP7CompatibleERC20(() =>
        buildTestContext().then(async (context) => {
          await initializeProxy(context);

          return context;
        })
      );
    });
  });
});
