import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";

// 1. 连接到本地或 devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// 2. 读取payer钱包（假设本地有id.json）
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, "utf-8")))
);
console.log("payer", payer.publicKey.toBase58());

// 3. 指定接收者地址
// const recipient = new PublicKey("你的接收者地址");
const recipient = payer.publicKey; // mint t

// 4. 主流程
(async () => {
  // 创建mint
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null, // freeze authority
    6 // 小数位数
  );
  console.log("Mint address:", mint.toBase58());

  // 获取或创建接收者的token账户
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient
  );
  console.log("Recipient Token Account:", recipientTokenAccount.address.toBase58());

  // mint 1000 token（实际为1000 * 10^6）
  await mintTo(
    connection,
    payer,
    mint,
    recipientTokenAccount.address,
    payer,
    1000_000_000 // 1000 token, 6位小数
  );
  console.log("Minted 1000 tokens to recipient.");
})();