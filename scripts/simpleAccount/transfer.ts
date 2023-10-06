import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { CLIOpts } from "../../src";
import axios from "axios";

require("dotenv").config();
const RPC = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ENTRY_POINT = process.env.ENTRYPOINT as string;
const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
const PAYMASTER = {
  rpcUrl: process.env.PAYMASTER_URL as string,
  context: { type: process.env.PAYMASTER_CONTEXT },
};

export default async function main(t: string, amt: string, opts: CLIOpts) {
  const paymaster = opts.withPM
    ? Presets.Middleware.verifyingPaymaster(PAYMASTER.rpcUrl, PAYMASTER.context)
    : undefined;
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new ethers.Wallet(PRIVATE_KEY),
    RPC,
    ENTRY_POINT,
    SIMPLE_ACCOUNT_FACTORY,
    paymaster
  );
  const client = await Client.init(RPC, ENTRY_POINT);

  const target = ethers.utils.getAddress(t);
  const value = ethers.utils.parseEther(amt);

  const res = await client.sendUserOperation(
    simpleAccount.execute(target, value, "0x"),

    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const event = await res.wait();
  console.log(`Transaction hash: ${event?.transactionHash ?? null}`);

  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const txStatus = await provider.getTransactionReceipt(
    event?.transactionHash as string
  );
  console.log(`Transaction status: ${txStatus?.status ?? null}`);
}
