import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { UNISWAP_V2_ROUTER_ABI } from "../../src";
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

  simpleAccount.useDefaults({ callGasLimit: 900000 });
  const client = await Client.init(RPC, ENTRY_POINT);

  const sender = simpleAccount.getSender();

  let userOperation: any;

  // "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // On Polygon
  // Connects to bridgeContract
  const swapContract = new ethers.Contract(
    "0x8547e2E16783Fdc559C435fDc158d572D1bD0970", // BINANCE
    UNISWAP_V2_ROUTER_ABI,
    provider
  );

  const factory = await swapContract.factory()
  console.log("Factory", factory)

  const deadline = (Math.floor(Date.now() / 1000) + 60 * 20).toString();

  // Gets the min amount aprox
  // const amountOutMin = await swapContract.getAmountsOut(
  //   ethers.BigNumber.from("103716194300"),
  //   [
  //     "0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
  //     "0x0a70dDf7cDBa3E8b6277C9DDcAf2185e8B6f539f",
  //   ]
  // );

  // console.log(amountOutMin);

  //SWAPPING FROM TOKEN TO TOKEN

  const res = await client.sendUserOperation(
    simpleAccount.execute(
      swapContract.address, // To Contracto
      ethers.BigNumber.from("1037161943"), // Value Sent
      swapContract.interface.encodeFunctionData("swapExactTokensForTokens", [
        ethers.BigNumber.from("1037161943"), // AMOUNT
        1,
        [
          "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
          "0x0a70dDf7cDBa3E8b6277C9DDcAf2185e8B6f539f",
        ],
        sender,
        deadline,
      ])
    )
  );

  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await userOperation.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
