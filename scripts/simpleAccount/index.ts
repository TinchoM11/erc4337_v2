#!/usr/bin/env node
import { Command } from "commander";
import address from "./address";
import transfer from "./transfer";
import erc20Transfer from "./erc20Transfer";
import erc20Approve from "./erc20Approve";
import completeSwap from "./completeSwap";
import completeBridge from "./completeBridge";
import redeem from "./redeem";
import batchErc20Transfer from "./batchErc20Transfer";
import uniswap from "./unsiwap";
import synapseBridge from "./synapseBridge";

const program = new Command();

program
  .name("ERC-4337 SimpleAccount")
  .description(
    "A collection of example scripts for working with ERC-4337 SimpleAccount.sol"
  )
  .version("0.1.0");

program
  .command("address")
  .description("Generate a counterfactual address.")
  .action(address);

program
  .command("transfer")
  .description("Transfer ETH")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .requiredOption("-t, --to <address>", "The recipient address")
  .requiredOption("-amt, --amount <eth>", "Amount in ETH to transfer")
  .action(async (opts) =>
    transfer(opts.to, opts.amount, {
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("erc20Transfer")
  .description("Transfer ERC-20 token")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .requiredOption("-tkn, --token <address>", "The token address")
  .requiredOption("-t, --to <address>", "The recipient address")
  .requiredOption("-amt, --amount <decimal>", "Amount of the token to transfer")
  .action(async (opts) =>
    erc20Transfer(opts.token, opts.to, opts.amount, {
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("erc20Approve")
  .description("Approve spender for ERC-20 token")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .requiredOption("-tkn, --token <address>", "The token address")
  .requiredOption("-s, --spender <address>", "The spender address")
  .requiredOption("-amt, --amount <decimal>", "Amount of the token to transfer")
  .action(async (opts) =>
    erc20Approve(opts.token, opts.spender, opts.amount, {
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("batchErc20Transfer")
  .description("Batch transfer ERC-20 token")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .requiredOption("-tkn, --token <address>", "The token address")
  .requiredOption(
    "-t, --to <addresses>",
    "Comma separated list of recipient addresses"
  )
  .requiredOption("-amt, --amount <decimal>", "Amount of the token to transfer")
  .action(async (opts) =>
    batchErc20Transfer(opts.token, opts.to.split(","), opts.amount, {
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("completeSwap")
  .description("Swap from ERC20 to another token")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .action(async (opts) =>
    completeSwap({
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("completeBridge")
  .description("Bridge between chains")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .action(async (opts) =>
    completeBridge({
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("uniswap")
  .description("Bridge between chains")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .action(async (opts) =>
    uniswap({
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("synapseBridge")
  .description("Bridge with Synapse to DFK")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .action(async (opts) =>
    synapseBridge({
      dryRun: Boolean(opts.dryRun),
      withPM: Boolean(opts.withPaymaster),
    })
  );

program
  .command("redeem")
  .description("Redeem Transaction Wormhole")
  .option(
    "-dr, --dryRun",
    "Builds the UserOperation without calling eth_sendUserOperation"
  )
  .option("-pm, --withPaymaster", "Use a paymaster for this transaction")
  .action(async (opts) => {
    const result = await redeem();
    if (result === false) {
      console.error("Redeem failed");
      // Tratar el caso en que redeem devuelva false si es necesario
    } else {
      console.log("Redeem successful");
    }
  });

program.parse();
