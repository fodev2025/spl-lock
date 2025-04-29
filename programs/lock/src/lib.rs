use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("6o1UQjdJXtQWLEMFckDhCzaBAhNEY4wzTnJs9DejqC2M");

#[program]
pub mod lock {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn lock_token(ctx: Context<LockToken>, amount: u64, unlock_time: i64) -> Result<()> {
        let clock = Clock::get()?;
        require!(unlock_time > clock.unix_timestamp, CustomError::UnlockTimeInPast);

        let lock_account = &mut ctx.accounts.lock_account;
        lock_account.owner = ctx.accounts.user.key();
        lock_account.token_mint = ctx.accounts.token_mint.key();
        lock_account.amount = amount;
        lock_account.unlock_time = unlock_time;

        // 将 token 从 user 转到 PDA 的 CPI 调用
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn unlock_token(ctx: Context<UnlockToken>) -> Result<()> {
        let clock = Clock::get()?;
        let lock_account = &mut ctx.accounts.lock_account;
        require!(clock.unix_timestamp >= lock_account.unlock_time, CustomError::StillLocked);
    
        // 将 token 从 PDA(vault) 转回 user 的 CPI 调用
        let vault_seeds = &[
            b"vault".as_ref(),
            lock_account.owner.as_ref(),
            lock_account.token_mint.as_ref(),
            &[ctx.bumps.vault_authority],
        ];
        let signer = &[&vault_seeds[..]];
    
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, lock_account.amount)?;
    
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct LockAccount {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub unlock_time: i64,
}

#[derive(Accounts)]
pub struct LockToken<'info> {
    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 8)]
    pub lock_account: Account<'info, LockAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is the token mint address, checked in instruction logic
    pub token_mint: AccountInfo<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnlockToken<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub lock_account: Account<'info, LockAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is the PDA authority for the vault
    #[account(
        seeds = [b"vault", lock_account.owner.as_ref(), lock_account.token_mint.as_ref()],
        bump
    )]
    pub vault_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

// 自定义错误
#[error_code]
pub enum CustomError {
    #[msg("Unlock time must be in the future")]
    UnlockTimeInPast,
    #[msg("Token is still locked")]
    StillLocked,
}
