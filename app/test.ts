import { Keypair, PublicKey } from "@solana/web3.js";
import { LockApi } from "./lock-api";
import fs from "fs";

const key: number[] = JSON.parse(
  fs.readFileSync("/home/guoping/.config/solana/id.json", "utf-8")
);
const user = Keypair.fromSecretKey(new Uint8Array(key));
const rpcUrl = "https://api.devnet.solana.com";

const mint = new PublicKey("95Ha3i4XYZQ5WeYn4qWLPR1MLukqVgGES5iKEV3oT2Ci");
const programId = "6o1UQjdJXtQWLEMFckDhCzaBAhNEY4wzTnJs9DejqC2M";

const lockApi = new LockApi(programId, rpcUrl);

async function lockDataTest() {
  const lockData = await lockApi.getLockAccountData(mint, user.publicKey);
  console.log("Lock Data:", lockData);
}

async function evntsTest() {
  const signature =
    "3ybLLWZ7HeiM1LdnqW3aXU1tz1sQhBsBKVX8nry7WgQkLu3XmeX6veoyfyXaco98ZjvRkCQ6sthpWXHnz3nRobwp";
  const events = await lockApi.readEventsFromTransaction(signature);
  console.log("Events:", events);
}

async function depositTest() {
  const amount = 100_000;
  const unlockTime = Math.floor(Date.now() / 1000) + 60; // 60秒后可解锁
  const sig = await lockApi.deposit(user, mint, amount.toString(), unlockTime);
  console.log("Transaction Signature:", sig);
  console.log("Token 已成功 lock 到锁仓合约！");
}

async function withdrawTest() {
  const sig = await lockApi.withdraw(user, mint);
  console.log("Transaction Signature:", sig);
  console.log("Token 已成功解锁！");
}

// depositTest();
// withdrawTest();
// evntsTest();
// lockDataTest();
