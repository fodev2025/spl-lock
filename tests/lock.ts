import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lock } from "../target/types/lock";
import { PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { getAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("lock", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.lock as Program<Lock>;
  const provider = anchor.getProvider();

  let mint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let lockAccount: PublicKey;
  let vaultAuthority: PublicKey;
  let bump: number;

  const user = (provider.wallet as anchor.Wallet).payer;
  const lockDuration = 10;

  before(async () => {
    // 创建测试用的mint和token账户
    mint = await createMint(provider.connection, user, user.publicKey, null, 6);
    userTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        mint,
        user.publicKey
      )
    ).address;

    // 给用户账户mint一些token
    await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount,
      user,
      1000_000
    );

    // 派生PDA和vault token账户
    [vaultAuthority, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), user.publicKey.toBuffer(), mint.toBuffer()],
      program.programId
    );

    // 创建 vaultTokenAccount，owner 为 vaultAuthority
    // vaultTokenAccount = await createAccount(
    //   provider.connection,
    //   user, // payer
    //   mint,
    //   vaultAuthority, // owner
    //   user
    // );
    vaultTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        mint,
        vaultAuthority,
        true
      )
    ).address;
  });

  let amount: anchor.BN;
  it("Lock token", async () => {
    // 创建lockAccount的keypair
    const lockAccountKeypair = anchor.web3.Keypair.generate();
    lockAccount = lockAccountKeypair.publicKey;

    const unlockTime = Math.floor(Date.now() / 1000) + lockDuration;
    amount = new anchor.BN(100_000);
    const beforeVault = await getAccount(
      provider.connection,
      vaultTokenAccount
    );
    const beforeUser = await getAccount(provider.connection, userTokenAccount);

    await program.methods
      .lockToken(amount, new anchor.BN(unlockTime))
      .accounts({
        lockAccount: lockAccount,
        user: user.publicKey,
        tokenMint: mint,
        userTokenAccount: userTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
      })
      .signers([lockAccountKeypair])
      .rpc();

    // lock 后余额
    const afterVault = await getAccount(provider.connection, vaultTokenAccount);
    const afterUser = await getAccount(provider.connection, userTokenAccount);

    expect(Number(afterVault.amount)).to.equal(
      Number(beforeVault.amount) + Number(amount)
    );
    expect(Number(afterUser.amount)).to.equal(
      Number(beforeUser.amount) - Number(amount)
    );
  });

  it("Unlock token", async () => {
    // 等待解锁时间
    await new Promise((resolve) =>
      setTimeout(resolve, (lockDuration + 1) * 1000)
    );

    const beforeVault = await getAccount(
      provider.connection,
      vaultTokenAccount
    );
    const beforeUser = await getAccount(provider.connection, userTokenAccount);

    await program.methods
      .unlockToken()
      .accounts({
        lockAccount: lockAccount,
        userTokenAccount: userTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
      })
      .rpc();

    const afterVault = await getAccount(provider.connection, vaultTokenAccount);
    const afterUser = await getAccount(provider.connection, userTokenAccount);

    expect(Number(afterVault.amount)).to.equal(0);
    expect(Number(afterVault.amount)).to.equal(
      Number(beforeVault.amount) - Number(amount)
    );
    expect(Number(afterUser.amount)).to.equal(
      Number(beforeUser.amount) + Number(amount)
    );
  });
});
