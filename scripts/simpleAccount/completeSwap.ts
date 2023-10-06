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

export default async function main(opts: CLIOpts) {
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

  // Gets TX Quote First
  let swapData = JSON.stringify({
    chainId: 10,
    inputTokens: [
      {
        tokenAddress: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
        amount: "3701874",
      },
    ],
    outputTokens: [
      {
        tokenAddress: "0x0000000000000000000000000000000000000000",
        proportion: 1,
      },
    ],
    userAddr: "0xAB0F93FdB3866B57339A950e8b02C19fA196B245",
    slippageLimitPercent: 1,
    sourceBlacklist: [],
    sourceWhitelist: [],
    simulate: false,
    pathViz: false,
  });

  const quoteConfig = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.odos.xyz/sor/quote/v2",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    data: swapData,
  };

  const quoteData = await axios.request(quoteConfig);
  console.log("QuoteData: ", quoteData.data);
  const pathId = quoteData.data.pathId;

  // With the given pathId, we can now assemble the swap transaction
  const data = JSON.stringify({
    userAddr: "0xAB0F93FdB3866B57339A950e8b02C19fA196B245",
    pathId: pathId, // associated to the user address
    simulate: false,
  });

  const swapTxConfig = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.odos.xyz/sor/assemble",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    data: data,
  };

  const swapTxData = await axios.request(swapTxConfig);
  console.log("SwapTxData: ", swapTxData.data);

  // spenderAddress is the "swap Contract" that will be used (given by swapTxData / OdosAPI)
  // This is used for giving approve/allowance before the swap to this spender
  const spenderAddress = ethers.utils.getAddress(
    swapTxData.data?.transaction.to
  );

  const sender = await simpleAccount.getSender();

  let userOperation: any;

  if (
    swapTxData.data.inputTokens[0].tokenAddress !==
    "0x0000000000000000000000000000000000000000"
  ) {
    console.log("De TOKEN");
    const token = ethers.utils.getAddress(
      swapTxData.data.inputTokens[0].tokenAddress
    );
    const erc20 = new ethers.Contract(token, ERC20_ABI, provider);

    const dest: Array<string> = [];
    const data: Array<string> = [];

    const actualAllowance = await erc20.allowance(sender, spenderAddress);

    //We check allowance. If allowance isn't enough, we will approve and Swap in the same transaction
    //If allowance is already enough, we will only make the swap.
    if (actualAllowance.lt(swapTxData.data.inputTokens[0].amount)) {
      dest.push(erc20.address);
      data.push(
        erc20.interface.encodeFunctionData("approve", [
          spenderAddress,
          swapTxData.data.inputTokens[0].amount,
        ])
      );
    }

    // Push to the array of "dest" and "data" the swap function
    dest.push(swapTxData.data?.transaction.to);
    data.push(swapTxData.data?.transaction.data);

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
        swapTxData.data?.transaction.to,
        swapTxData.data.transaction.value,
        swapTxData.data.transaction.data
      ),
      {
        dryRun: opts.dryRun,
        onBuild: (op) => console.log("Signed UserOperation:", op),
      }
    );
  }

  console.log(`UserOpHash: ${userOperation.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await userOperation.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
