import { ethers } from "ethers";
import { Client, Presets } from "userop";
import axios from "axios";
import { CLIOpts } from "../../src";
import { SynapseSDK } from "@synapsecns/sdk-router";

require("dotenv").config();
const RPC = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ENTRY_POINT = process.env.ENTRYPOINT as string;
const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
const PAYMASTER = {
  rpcUrl: process.env.PAYMASTER_URL as string,
  context: { type: process.env.PAYMASTER_CONTEXT },
};

export default async function main(opts: CLIOpts) {
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

  simpleAccount.useDefaults({ callGasLimit: 900000 });
  const client = await Client.init(RPC, ENTRY_POINT);

  const sender = simpleAccount.getSender();

  let userOperation: any;

  const fromChainProvider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL
  );
  const DFKProvider = new ethers.providers.JsonRpcProvider(
    process.env.DFK_RPC_MAINNET as string
  );
  const chainIds = [137, 53935];
  const providers = [fromChainProvider, DFKProvider];
  const Synapse = new SynapseSDK(chainIds, providers);

  const deadline = ethers.BigNumber.from(
    Math.floor(Date.now() / 1000) + 60 * 20
  );

  const quote = await Synapse.bridgeQuote(
    137, // From Chain
    53935, // To Chain
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // From token Address USDC POL
    "0x3AD9DFE640E1A9Cc1D9B0948620820D975c3803a", // To token Address USDC DFK
    ethers.BigNumber.from("2500000"), // From Amount
    deadline, // Deadline
    true // Exclude CCTP
  );

  /// This returns the complete Quote object
  console.log("Bridge Quote:", quote);

  // Now we can construct a Transaction Bridge
  const BridgeTx = await Synapse.bridge(
    "0x23eD50dB3e7469695DD30FFD22a7B42716A338FC", // To Address My New DFK Wallet
    quote.routerAddress, // Router Address
    137, // From Chain
    53935, // To Chain
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // From TOKEN
    ethers.BigNumber.from("2500000"), // Amount
    quote.originQuery, // Origin query from bridgeQuote()
    quote.destQuery // Origin query from bridgeQuote()
  );

  console.log(`To: ${BridgeTx.to}`);
  console.log(`Data: ${BridgeTx.data}`);

  /// WE NEED TO APPROVE THE BRIDGE ROUTER TO SPEND OUR TOKENS FIRST!!!!!

  // const res = await client.sendUserOperation(
  //   simpleAccount.execute(
  //     BridgeTx.to as string, // To Contract
  //     0, // Value Sent
  //     BridgeTx.data as string
  //   )
  // );

  // console.log(`UserOpHash: ${res.userOpHash}`);

  // console.log("Waiting for transaction...");
  // const ev = await res.wait();
  // console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
