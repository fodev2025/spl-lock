import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Lock } from "../target/types/lock";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// 1. 初始化 provider 和 program
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.lock as Program<Lock>;

console.log("programId", program.programId.toBase58());

// 2. 配置参数
const mint = new PublicKey("JDzPbXboQYWVmdxXS3LbvjM52RtsV1QaSv2AzoCiai2o"); // 替换为你的mint地址
const user = provider.wallet as anchor.Wallet;
const amount = new BN(100_000); // 例如锁定0.1 token（6位小数）
const unlockTime = new BN(Math.floor(Date.now() / 1000) + 60); // 60秒后可解锁

(async () => {
  // 3. 计算相关PDA
  const [lockAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lock_account"), user.publicKey.toBuffer(), mint.toBuffer()],
    program.programId
  );
  const [vaultTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_token"), lockAccountPda.toBuffer()],
    program.programId
  );
  // 4. 获取用户的ATA
  const userTokenAccount = await getAssociatedTokenAddress(
    mint,
    user.publicKey
  );

  // 5. 调用合约deposit方法
  await program.methods
    .deposit(amount, unlockTime)
    .accounts({
      user: user.publicKey,
      userTokenAccount,
      mint,
    } as unknown as anchor.Accounts)
    .rpc();

  console.log("Token 已成功 lock 到锁仓合约！");
})();
