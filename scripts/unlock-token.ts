import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Lock } from "../target/types/lock";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// 1. 初始化 provider 和 program
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.lock as Program<Lock>;

// 2. 配置参数
const mint = new PublicKey("JDzPbXboQYWVmdxXS3LbvjM52RtsV1QaSv2AzoCiai2o"); // 替换为你的mint地址
const user = provider.wallet as anchor.Wallet;

(async () => {
  // 3. 计算相关PDA
  const [lockAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lock_account"), user.publicKey.toBuffer(), mint.toBuffer()],
    program.programId
  );
  const [vaultTokenAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_token"), lockAccountPda.toBuffer()],
    program.programId
  );
  // 4. 获取用户的ATA
  const userTokenAccount = await getAssociatedTokenAddress(
    mint,
    user.publicKey
  );

  // 5. 调用合约withdraw方法
  await program.methods
    .withdraw()
    .accounts({
      user: user.publicKey,
      userTokenAccount,
      mint,
      vaultTokenAccount: vaultTokenAccountPda,
      lockAccount: lockAccountPda,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    } as unknown as anchor.Accounts)
    .rpc();

  console.log("Token 已成功解锁！");
})();
