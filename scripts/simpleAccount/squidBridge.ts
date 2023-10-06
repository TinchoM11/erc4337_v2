import { BigNumber, ethers } from "ethers";
import { CLIOpts } from "../../src";
import { Client, Presets } from "userop";
import axios from "axios";
import { hexlify } from "ethers/lib/utils";

require("dotenv").config();
const PK_EOA = process.env.PK_EOA as string;
const RPC = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ENTRY_POINT = process.env.ENTRYPOINT as string;
const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
const PAYMASTER = {
  rpcUrl: process.env.PAYMASTER_URL as string,
  context: { type: process.env.PAYMASTER_CONTEXT },
};

export default async function squid(opts: CLIOpts) {
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

  simpleAccount.useDefaults({ callGasLimit: 600000 });
  const client = await Client.init(RPC, ENTRY_POINT);

  const url = "https://api.0xsquid.com/v1/route";

  const config = {
    params: {
      fromChain: 56, // Source Chain ID
      fromToken: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      fromAmount: "1000000000000000000", //
      toChain: 8453, // Destination Chain ID
      toToken: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", // Token Address on Destination Chain
      toAddress: "0xfA73Aec7c5ABe6582636edb52165bF39566593a7", // the recipient's address
      slippage: 3, // 3 --> 3.00% slippage
    },
  };
  const result = await axios.get(url, config);

  const txRequest = result.data.route.transactionRequest;

  console.log("TxRequest:", txRequest);

  // MAKE TX WITH SMART WALLETS
  // const userOperation = await client.sendUserOperation(
  //   simpleAccount.execute(
  //     txRequest.targetAddress,
  //     BigNumber.from(txRequest.value).toHexString(),
  //     txRequest.data
  //   )
  // );

  // const userOperationHash = userOperation.userOpHash;
  // const transacionHash = await userOperation.wait();

  // console.log(`UserOperationHash: ${userOperationHash}`);
  // console.log(`TransactionHash: ${transacionHash}`);

  // MAKE TRANSACTION WITH EOA WALLETS
  // const provider = new ethers.providers.JsonRpcProvider(
  //   "https://spring-white-pine.base-mainnet.quiknode.pro/76fa52788ff2491249c16505d4f68e3ee6c4d660/"
  // );

  // // // Get Wallet from PK
  // const account = new ethers.Wallet(PK_EOA, provider);
  // console.log("Account Address:", account.address);
  // const nonce = await provider.getTransactionCount(account.address);
  // const maxFeePerGas = BigNumber.from(txRequest.maxFeePerGas);
  // const maxPriorityFeePerGas = BigNumber.from(txRequest.maxPriorityFeePerGas);

  // const formattedTxRequest = {
  //   value: hexlify(BigNumber.from(txRequest.value)),
  //   data: txRequest.data,
  //   nonce,
  //   gasLimit: BigNumber.from(txRequest.gasLimit),
  //   gasPrice: maxFeePerGas.add(maxPriorityFeePerGas),
  //   chainId: 8453, // Chain ID Polygon in this case
  // };

  // try {
  //   const signedTransaction = await account.signTransaction(formattedTxRequest);
  //   const txResponse = await provider.sendTransaction(signedTransaction);
  //   console.log("Transaction sent:", txResponse.hash);
  // } catch (error) {
  //   console.error("Error sending transaction:", error);
  // }
}
