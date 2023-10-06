import { ethers } from "ethers";
import { ERC20_ABI } from "../../src";
// @ts-ignore
import { Client, Presets } from "userop";
import { CLIOpts } from "../../src";

require("dotenv").config();
const RPC = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ENTRY_POINT = process.env.ENTRYPOINT as string;
const SIMPLE_ACCOUNT_FACTORY = process.env.SIMPLE_ACCOUNT_FACTORY as string;
const PAYG_PAYMASTER = {
  rpcUrl: process.env.PAYMASTER_URL as string,
  context: { type: process.env.PAYMASTER_CONTEXT },
};

export default async function main(
  tkn: string,
  t: string,
  amt: string,
  opts: CLIOpts
) {
  const paymaster = opts.withPM
    ? Presets.Middleware.verifyingPaymaster(
        PAYG_PAYMASTER.rpcUrl,
        PAYG_PAYMASTER.context
      )
    : undefined;
  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    new ethers.Wallet(PRIVATE_KEY),
    RPC,
    ENTRY_POINT,
    SIMPLE_ACCOUNT_FACTORY,
    paymaster
  );
  simpleAccount.useDefaults({ callGasLimit: 60000 });
  const client = await Client.init(RPC, ENTRY_POINT);

  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const token = ethers.utils.getAddress(tkn);
  const to = ethers.utils.getAddress(t);
  const erc20 = new ethers.Contract(token, ERC20_ABI, provider);
  const [symbol, decimals] = await Promise.all([
    erc20.symbol(),
    erc20.decimals(),
  ]);

  const balance = await provider.getBalance(
    simpleAccount.getSender(),
    "latest"
  );

  console.log(`Sender balance: ${ethers.utils.formatEther(balance)}`);

  console.log(`Transferring ${amt} ${symbol}...`);
  const amount = ethers.utils.parseUnits(amt, decimals);

  const res = await client.sendUserOperation(
    simpleAccount.execute(
      erc20.address,
      0,
      erc20.interface.encodeFunctionData("transfer", [to, amount])
    ),
    {
      dryRun: opts.dryRun,
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  console.log(`UserOpHash: ${res.userOpHash}`);

  console.log("Waiting for transaction...");
  const ev = await res.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
}
