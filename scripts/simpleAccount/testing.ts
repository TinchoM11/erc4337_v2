// import { ethers } from "ethers";
// import { ERC20_ABI } from "../../src";
// import axios from "axios";
// import { Client, Presets, UserOperationBuilder } from "userop";
// import { CLIOpts } from "../../src";

// require("dotenv").config();
// const RPC = process.env.RPC_URL as string;
// const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
// const ENTRY_POINT = process.env.ENTRYPOINT as string;
// const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
// const PAYMASTER = {
//   "rpcUrl": process.env.PAYMASTER_URL as string,
//   "context": { "type": process.env.PAYMASTER_CONTEXT},
// };

// export default async function main(
//   opts: CLIOpts
// ) {
//   const paymaster = opts.withPM
//     ? Presets.Middleware.verifyingPaymaster(
//         PAYMASTER.rpcUrl,
//         PAYMASTER.context
//       )
//     : undefined;
//   const simpleAccount = await Presets.Builder.SimpleAccount.init(
//     new ethers.Wallet(PRIVATE_KEY),
//     RPC,
//     ENTRY_POINT,
//     SIMPLE_ACCOUNT_FACTORY,
//     paymaster
//   );
  
//   simpleAccount.useDefaults({ callGasLimit: 60000 });
//   const client = await Client.init(RPC,ENTRY_POINT);


//   const signer = new ethers.Wallet(PRIVATE_KEY);

// // Gets tx data from odosAPI
// const params = {
//     fromChain: 137,
//     toChain: 43114,
//     fromToken: "MATIC",
//     toToken: "AVAX", // TODO: for rn we only bridge to the same token as wormhole only supports that
//     fromAmount: "100000000000000000",
//     fromAddress: "0xa81D8dD4550Ee126Ab77De7845b4359AA7afae22",
//     toAddress: "0x5023dCB71E64F2890649A8D99E04A5C3C5e115B0",
//     order: "RECOMMENDED",
//   };

//   const provider = new ethers.providers.JsonRpcProvider("https://blue-fragrant-needle.matic.quiknode.pro/398157348b1378b7e59f4ccf29e1b10706fe8d97/");
  
//   const nonce =  await provider.getTransactionCount(simpleAccount.getSender())
//   console.log("Nonce: ", nonce)

//   const nonce2 = simpleAccount.getNonce()
//   console.log("Nonce2: ", nonce2)

//   const nonce3 = await provider.getTransactionCount(signer.address)
//   console.log("Nonce3: ", nonce3)


//   const quote = (await axios.get(`https://li.quest/v1/quote`, { params })).data;
//   const builder = new UserOperationBuilder().useDefaults({ sender: simpleAccount.getSender() })
//   .setSender(simpleAccount.getSender())
//   .setNonce(0x18)
//   .setCallData(quote.transactionRequest.data)
//   .setPreVerificationGas(quote.transactionRequest.gasLimit)
//   .useMiddleware(Presets.Middleware.getGasPrice(provider))
//   .useMiddleware(Presets.Middleware.EOASignature(signer))

// //let userOp = await client.buildUserOperation(builder)
// //console.log(userOp)


//   //   const res = await client.sendUserOperation(
// //     simpleAccount.execute(
// //       erc20.address,
// //       0,
// //       erc20.interface.encodeFunctionData("transfer", [to, amount])
// //     ),
// //     {
// //       dryRun: opts.dryRun,
// //       onBuild: (op) => console.log("Signed UserOperation:", op),
// //     }
// //   );
// //   console.log(`UserOpHash: ${res.userOpHash}`);

// //   console.log("Waiting for transaction...");
// //   const ev = await res.wait();
// //   console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
// }

// const dest: Array<string> = [];
// const data: Array<string> = [];

// dest.push(erc20.address);
// data.push(
//   erc20.interface.encodeFunctionData("approve", [
//     spenderAddress,
//     amount,
//   ])
// );
// }

// // Push to the array of "dest" and "data" the swap function
// dest.push(bridgeContractAddress);
// data.push(bridgeTxCalldata);

// // Send userOperation (batch for ApproveAnd Bridge)
// userOperation = await client.sendUserOperation(
// simpleAccount.executeBatch(dest, data),
// );