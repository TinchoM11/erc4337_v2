import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { hexlify } from "ethers/lib/utils";
import {
  coalesceChainId,
  getEmitterAddressSolana as wormholeGetEmitterAddressSolana,
  getSignedVAA as wormholeGetSignedVAA,
  getSignedVAAWithRetry,
  redeemOnSolana as wormholeRedeemOnSolana,
  transferFromSolana as wormholeTransferFromSolana,
} from "@certusone/wormhole-sdk";
import { CLIOpts } from "../../src";
import { grpc } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
require("dotenv").config();
const RPC =
  "https://api.stackup.sh/v1/node/63f154b576456796525ac322ffc5522ea1869043a5fea5cea3024e8894cd58f9";
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ENTRY_POINT = process.env.ENTRYPOINT as string;
const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
const PAYMASTER = {
  rpcUrl: process.env.PAYMASTER_URL as string,
  context: { type: process.env.PAYMASTER_CONTEXT },
};

export const WORMHOLE_POLY_ABI = [
  // Authenticated Functions
  "function completeTransfer(bytes encodedVm) returns (bool)",
  "function transferTokens(address token,uint256 amount,uint16 recipientChain,bytes32 recipient,uint256 arbiterFee,uint32 nonce)",
];

export default async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const paymaster = Presets.Middleware.verifyingPaymaster(
    PAYMASTER.rpcUrl,
    PAYMASTER.context
  );
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new ethers.Wallet(PRIVATE_KEY),
    RPC,
    ENTRY_POINT,
    SIMPLE_ACCOUNT_FACTORY,
    paymaster
  );
  simpleAccount.useDefaults({ callGasLimit: 6000000 });
  const client = await Client.init(RPC, ENTRY_POINT);

  // Connects to bridgeContract
  const bridgeContract: ethers.Contract = new ethers.Contract(
    "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
    WORMHOLE_POLY_ABI,
    provider
  );

  const signedVAA = await getSignedVAAfunctino();
  if (signedVAA === null) return false;

  // Construct a userOp calling contract function completeTransfer
  const userOperation = await client.sendUserOperation(
    simpleAccount.execute(
      bridgeContract.address,
      0,
      bridgeContract.interface.encodeFunctionData("completeTransfer", [
        hexlify(signedVAA),
      ])
    )
  );

  console.log(`UserOpHash: ${userOperation.userOpHash}`);

  console.log("Waiting for transaction...");
  try {
    const ev = await userOperation.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
  } catch (e: any) {
    throw new Error(`RedeemTx could not be done, ${e.message}`);
  }

  // Asegúrate de retornar una promesa resuelta con void
  return Promise.resolve();
}

async function getSignedVAAfunctino() {
  try {
    console.log("Getting VAA...");
    const WORMHOLE_RPC_HOST = "https://wormhole-v2-mainnet-api.staking.fund";
    const res = await getSignedVAAWithRetry(
      [WORMHOLE_RPC_HOST],
      1, // Chain ID (WOrmhole Chain ID in fact)
      "ec7372995d5cc8732397fb0ad35c0121e0eaa90d26f828a534cab54391b3a4f5", // Emiter Address
      "421126", // Sequence
      // eslint-disable-next-line new-cap
      { transport: NodeHttpTransport() }
    );
    console.log("VAA: ", res);
    // If VAA signature is not available yet exit
    if (!res) return null;
    else return res.vaaBytes;
  } catch (e: any) {
    if (e.message !== "requested VAA not found in store") throw e;
    else return null;
  }
}
