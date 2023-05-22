import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { ERC20_ABI } from "../../src";
import { CLIOpts } from "../../src";
require("dotenv").config();
const RPC = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ENTRY_POINT = process.env.ENTRYPOINT as string;
const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
const PAYMASTER = {
  rpcUrl: process.env.PAYMASTER_URL as string,
  context: { type: process.env.PAYMASTER_CONTEXT },
};

import axios from "axios";

export default async function main( opts: CLIOpts) {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
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
  simpleAccount.useDefaults({ callGasLimit: 600000  });
  const client = await Client.init(RPC, ENTRY_POINT);

  // Gets tx data from odosAPI
  let swapData = JSON.stringify({
    chainId: 56, /// pone el chainId necesario
    inputTokens: [
      {
        tokenAddress: "0x0000000000000000000000000000000000000000",
        amount: 39707551129272360,
      },
    ],
    outputTokens: [
      {
        tokenAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        proportion: 1,
      },
    ],
    userAddr: "0xa81D8dD4550Ee126Ab77De7845b4359AA7afae22",
    slippageLimitPercent: 3,
    sourceBlacklist: [],
    sourceWhitelist: [],
    simulate: false,
    pathViz: false,
    disableRFQs: true,
  });
  console.log("SwapData: ", swapData);
  const res = await axios.request({
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.odos.xyz/sor/swap",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    data: swapData,
  });

  // spenderAddress is the "swap Contract" that will be used (given by swapTxData / OdosAPI)
  // This is used for giving approve/allowance before the swap to this spender
  const spenderAddress = ethers.utils.getAddress(res.data?.transaction.to);

  const sender = await simpleAccount.getSender();

  let userOperation: any;

  if (
    res.data.inputTokens[0].tokenAddress !==
    "0x0000000000000000000000000000000000000000"
  ) {
    console.log("De TOKEN");
    const token = ethers.utils.getAddress(res.data.inputTokens[0].tokenAddress);
    const erc20 = new ethers.Contract(token, ERC20_ABI, provider);

    const dest: Array<string> = [];
    const data: Array<string> = [];

    const actualAllowance = await erc20.allowance(sender, spenderAddress);

    // We check allowance. If allowance isn't enough, we will approve and Swap in the same transaction
    // If allowance is already enough, we will only make the swap.
    if (actualAllowance.lt(res.data.inputTokens[0].amount)) {
      dest.push(erc20.address);
      data.push(
        erc20.interface.encodeFunctionData("approve", [
          spenderAddress,
          res.data.inputTokens[0].amount,
        ])
      );
    }

    // Push to the array of "dest" and "data" the swap function
    dest.push(res.data?.transaction.to);
    data.push(res.data?.transaction.data);

    // Construct userOperation (batch for ApproveAndSwap)
    userOperation = await client.sendUserOperation(
      simpleAccount.executeBatch(dest, data),
      {
        dryRun: opts.dryRun,
        onBuild: (op) => console.log("Signed UserOperation:", op),
      }
    );
  } else {
    userOperation = await client.sendUserOperation(
    simpleAccount.execute(
      res.data?.transaction.to,
      res.data.transaction.value,
      res.data.transaction.data,
      ),
      {
        dryRun: opts.dryRun,
        onBuild: (op) => console.log("Signed UserOperation:", op),
      })
    };

    console.log(`UserOpHash: ${userOperation.userOpHash}`);

    console.log("Waiting for transaction...");
    const ev = await userOperation.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
