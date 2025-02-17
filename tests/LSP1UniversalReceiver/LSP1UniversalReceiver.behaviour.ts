import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// types
import { ILSP1UniversalReceiver, UniversalReceiverTester } from "../../types";

// helpers
import { abiCoder, LSP1_HOOK_PLACEHOLDER } from "../utils/helpers";

// constants
import { EventSignatures } from "../../constants";

export type LSP1TestContext = {
  accounts: SignerWithAddress[];
  // contract that implement the LSP1 - Universal Receiver interface
  lsp1Implementation: ILSP1UniversalReceiver;
  // contract that call the `universalReceiver(...)` function (for testing)
  lsp1Checker: UniversalReceiverTester;
};

export const shouldBehaveLikeLSP1 = (
  buildContext: () => Promise<LSP1TestContext>
) => {
  let context: LSP1TestContext;

  beforeEach(async () => {
    context = await buildContext();
  });

  describe("when calling the `universalReceiver(...)` function", () => {
    const valueSent = 0;

    describe("from an EOA", () => {
      it("should emit a UniversalReceiver(...) event with correct topics", async () => {
        const caller = context.accounts[2];
        const data = "0xaabbccdd";

        await expect(
          context.lsp1Implementation
            .connect(caller)
            .universalReceiver(LSP1_HOOK_PLACEHOLDER, data, {
              value: valueSent,
            })
        )
          .to.emit(context.lsp1Implementation, "UniversalReceiver")
          .withArgs(
            // from
            caller.address,
            // value
            valueSent,
            // typeId
            LSP1_HOOK_PLACEHOLDER,
            // receivedData
            data,
            // returnedValue
            abiCoder.encode(["bytes", "bytes"], ["0x", "0x"])
          );
      });
    });

    describe("from a Contract", () => {
      describe("via a contract call - `contract.universalReceiver(...)`", () => {
        it("should emit an UniversalReceiver(...) event", async () => {
          await expect(
            context.lsp1Checker.checkImplementation(
              context.lsp1Implementation.address,
              LSP1_HOOK_PLACEHOLDER
            )
          )
            .to.emit(context.lsp1Implementation, "UniversalReceiver")
            .withArgs(
              // from
              context.lsp1Checker.address,
              // value
              valueSent,
              // typeId
              LSP1_HOOK_PLACEHOLDER,
              // receivedData
              "0x",
              // returnedValue
              abiCoder.encode(["bytes", "bytes"], ["0x", "0x"])
            );
        });
      });

      describe("via a low-level call - `address(contract).call(...)`", () => {
        it("should emit an UniversalReceiver(...) event", async () => {
          await expect(
            context.lsp1Checker.checkImplementationLowLevelCall(
              context.lsp1Implementation.address,
              LSP1_HOOK_PLACEHOLDER
            )
          )
            .to.emit(context.lsp1Implementation, "UniversalReceiver")
            .withArgs(
              // from
              context.lsp1Checker.address,
              // value
              valueSent,
              // typeId
              LSP1_HOOK_PLACEHOLDER,
              // receivedData
              "0x",
              // returnedValue
              abiCoder.encode(["bytes", "bytes"], ["0x", "0x"])
            );
        });
      });

      /**
       * @todo
       * test returned value of the `universalReceiver(...)` function
       * using `lsp1Checker.callImplementationAndReturn(...)`
       *
       */
    });
  });

  describe("when calling the `universalReceiver(...)` function while sending native tokens", () => {
    const valueSent = ethers.utils.parseEther("3");

    describe("from an EOA", () => {
      it("should emit a UniversalReceiver(...) event with correct topics", async () => {
        let caller = context.accounts[2];

        await expect(
          context.lsp1Implementation
            .connect(caller)
            .universalReceiver(LSP1_HOOK_PLACEHOLDER, "0x", {
              value: valueSent,
            })
        )
          .to.emit(context.lsp1Implementation, "UniversalReceiver")
          .withArgs(
            caller.address,
            valueSent,
            LSP1_HOOK_PLACEHOLDER,
            "0x",
            abiCoder.encode(["bytes", "bytes"], ["0x", "0x"])
          );
      });
    });

    describe("from a Contract", () => {
      beforeEach(async () => {
        await context.accounts[0].sendTransaction({
          to: context.lsp1Checker.address,
          value: ethers.utils.parseEther("5"),
        });
      });

      describe("via a contract call - `contract.universalReceiver(...)`", () => {
        it("should emit an UniversalReceiver(...) event", async () => {
          await expect(
            context.lsp1Checker.checkImplementation(
              context.lsp1Implementation.address,
              LSP1_HOOK_PLACEHOLDER,
              { value: valueSent }
            )
          )
            .to.emit(context.lsp1Implementation, "UniversalReceiver")
            .withArgs(
              // from
              context.lsp1Checker.address,
              // value
              valueSent,
              // typeId
              LSP1_HOOK_PLACEHOLDER,
              // receivedData
              "0x",
              // returnedValue
              abiCoder.encode(["bytes", "bytes"], ["0x", "0x"])
            );
        });
      });

      describe("via a low-level call - `address(contract).call(...)`", () => {
        it("should emit an UniversalReceiver(...) event", async () => {
          await expect(
            context.lsp1Checker.checkImplementationLowLevelCall(
              context.lsp1Implementation.address,
              LSP1_HOOK_PLACEHOLDER,
              { value: valueSent }
            )
          )
            .to.emit(context.lsp1Implementation, "UniversalReceiver")
            .withArgs(
              // from
              context.lsp1Checker.address,
              // value
              valueSent,
              // typeId
              LSP1_HOOK_PLACEHOLDER,
              // receivedData
              "0x",
              // returnedValue
              abiCoder.encode(["bytes", "bytes"], ["0x", "0x"])
            );
        });
      });
    });
  });
};
