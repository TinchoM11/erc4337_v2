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
  simpleAccount.useDefaults({ callGasLimit: 800000 });
  const client = await Client.init(RPC, ENTRY_POINT);

  // Gets tx data from odosAPI
  const params = {
    fromChain: 137,
    toChain: 56,
    fromToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    toToken: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    fromAmount: "2779230",
    fromAddress: "0x2934DBe013925607EF024CD584B0Ee3f340D4546",
    toAddress: "0x2934DBe013925607EF024CD584B0Ee3f340D4546",
    order: "RECOMMENDED",
  };

  const quote = (await axios.get(`https://li.quest/v1/quote`, { params })).data;
  console.log("Quote: ", quote);

  //spenderAddress is the "swap Contract" that will be used (given by swapTxData / OdosAPI)
  //This is used for giving approve/allowance before the swap to this spender
  const spenderAddress = ethers.utils.getAddress(
    quote.estimate.approvalAddress
  );

  const sender = simpleAccount.getSender();

  let userOperation: any;

  if (
    quote.action.fromToken.address !==
    "0x0000000000000000000000000000000000000000"
  ) {
    const token = ethers.utils.getAddress(quote.action.fromToken.address);
    const erc20 = new ethers.Contract(token, ERC20_ABI, provider);

    const dest: Array<string> = [];
    const data: Array<any> = [];

    const actualAllowance = await erc20.allowance(sender, spenderAddress);
    console.log("Actual Allowance", actualAllowance.toString());
    // We check allowance. If allowance isn't enough, we will approve and Swap in the same transaction
    // If allowance is already enough, we will only make the swap.
    if (actualAllowance.lt(quote.action.fromAmount)) {
      dest.push(erc20.address);
      data.push(
        erc20.interface.encodeFunctionData("approve", [
          spenderAddress,
          quote.action.fromAmount,
        ])
      );
    }

    // Push to the array of "dest" and "data" the swap function
    dest.push(quote?.transactionRequest.to);
    data.push(quote?.transactionRequest.data);
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
        quote?.transactionRequest.to,
        quote?.transactionRequest.value,
        quote?.transactionRequest.data
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
  if (quote.tool === "hyphen")
    await callExitEndpoint(ev.transactionHash, params.fromChain);
}

const maxDuration = 15 * 60 * 1000; // 15 minutes
let startTime: number;

async function callExitEndpoint(depositHash: string, chain: number) {
  const endpoint =
    "https://hyphen-v2-api.biconomy.io/api/v1/insta-exit/execute";
  if (!startTime) {
    startTime = Date.now();
  }

  try {
    const requestBody = {
      fromChainId: chain,
      depositHash: depositHash,
    };

    const response = await axios.post(endpoint, requestBody);
    const responseData = response.data;

    if (responseData.code === 200) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log("Exit hash found:", responseData.exitHash);
      console.log("Time taken:", duration / 1000, "seconds");
    } else {
      console.log("Exit hash not found. Retrying in 20 seconds...");
      if (Date.now() - startTime < maxDuration) {
        setTimeout(() => callExitEndpoint(depositHash, chain), 20000); // 20 seconds until next call
      } else {
        console.log("Max duration exceeded. Exiting...");
      }
    }
  } catch (error) {
    console.error("Error calling endpoint:", error);
    console.log("Retrying in 20 seconds...");
    if (Date.now() - startTime < maxDuration) {
      setTimeout(() => callExitEndpoint(depositHash, chain), 20000); // 20 seconds until next call
    } else {
      console.log("Max duration exceeded. Exiting...");
    }
  }
}
