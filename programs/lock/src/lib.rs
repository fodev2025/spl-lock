use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use solana_program::sysvar::clock::Clock; // Import Clock

declare_id!("6o1UQjdJXtQWLEMFckDhCzaBAhNEY4wzTnJs9DejqC2M"); // Replace with your program ID after build

#[program]
pub mod lock {
    use super::*;

    // Instruction to deposit tokens into the lock vault
    pub fn deposit(ctx: Context<DepositTokens>, amount: u64, unlock_time: i64) -> Result<()> {
        // --- Validation ---
        require!(amount > 0, ErrorCode::ZeroAmount);
        let clock = Clock::get()?;
        require!(
            unlock_time > clock.unix_timestamp,
            ErrorCode::UnlockTimeInPast
        );

        let lock_account = &mut ctx.accounts.lock_account;

        // If account is already initialized (not the first deposit for this user/mint)
        // Check the unlock time rule
        // Note: If using init_if_needed, the account might already exist but be empty
        // if initialized in a prior failed tx. A check on amount > 0 is more robust.
        if lock_account.amount > 0 {
            require!(
                unlock_time >= lock_account.unlock_time,
                ErrorCode::UnlockTimeMustBeGreaterOrEqual
            );
        }

        // --- State Update (before transfer for security) ---
        lock_account.user = *ctx.accounts.user.key;
        lock_account.mint = *ctx.accounts.mint.to_account_info().key;
        lock_account.unlock_time = unlock_time;
        lock_account.amount = lock_account
            .amount
            .checked_add(amount)
            .ok_or(ErrorCode::AmountOverflow)?;
        lock_account.bump = ctx.bumps.lock_account;

        // --- Token Transfer ---
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(DepositEvent {
            user: *ctx.accounts.user.key,
            mint: *ctx.accounts.mint.to_account_info().key,
            deposited_amount: amount,
            total_locked_amount: lock_account.amount,
            unlock_time: lock_account.unlock_time,
        });

        Ok(())
    }

    // Instruction to withdraw tokens from the lock vault
    pub fn withdraw(ctx: Context<WithdrawTokens>) -> Result<()> {
        let lock_account = &mut ctx.accounts.lock_account;

        // --- Validation ---
        require!(lock_account.amount > 0, ErrorCode::NoTokensLocked);
        // require!(lock_account.user == *ctx.accounts.user.key, LockVaultError::InvalidOwner); // Anchor constraint handles this
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= lock_account.unlock_time,
            ErrorCode::StillLocked
        );

        // --- Prepare for Transfer ---
        let amount_to_withdraw = lock_account.amount;

        // --- Token Transfer (using PDA signer) ---
        let seeds = &[
            b"lock_account".as_ref(),
            ctx.accounts.user.to_account_info().key.as_ref(),
            ctx.accounts.mint.to_account_info().key.as_ref(),
            &[lock_account.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: lock_account.to_account_info(), // PDA is the authority
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount_to_withdraw)?;

        // --- State Update (Reset lock amount after successful transfer) ---
        // We keep the account alive but reset the amount.
        lock_account.amount = 0;
        // Optional: reset unlock time as well
        lock_account.unlock_time = 0;

        // Note: We don't close the vault_token_account or lock_account here.
        // Closing them would require transferring lamports back and adds complexity.
        // Leaving them allows the user to deposit again without re-initialization costs.
        // A separate "close_lock" instruction could be added if needed.

        emit!(WithdrawEvent {
            user: *ctx.accounts.user.key,
            mint: *ctx.accounts.mint.to_account_info().key,
            withdrawn_amount: amount_to_withdraw,
        });

        Ok(())
    }
}

// --- Account Structs ---

#[derive(Accounts)]
#[instruction(amount: u64, unlock_time: i64)] // Make args available if needed for constraints
pub struct DepositTokens<'info> {
    // User initiating the deposit
    #[account(mut)]
    pub user: Signer<'info>,

    // User's token account for the mint they are depositing
    #[account(
        mut,
        constraint = user_token_account.mint == mint.key() @ ErrorCode::InvalidMint,
        constraint = user_token_account.owner == user.key() @ ErrorCode::InvalidOwner,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // The mint of the token being deposited
    pub mint: Account<'info, Mint>,

    // The PDA vault account storing the locked tokens.
    // Authority is the lock_account PDA. Initialized if needed.
    #[account(
        init_if_needed,
        payer = user,
        token::mint = mint,
        token::authority = lock_account, // PDA is the authority
        seeds = [b"vault_token".as_ref(), lock_account.key().as_ref()], // Seed with lock account key for uniqueness
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    // The PDA account storing lock metadata (amount, unlock time).
    // Seeds: user pubkey, mint pubkey. Ensures one lock per user per mint.
    #[account(
        init_if_needed,
        payer = user,
        space = LockAccount::LEN, // Define space requirement
        seeds = [b"lock_account".as_ref(), user.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub lock_account: Account<'info, LockAccount>,

    // System Programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>, // Needed for init_if_needed
}

#[derive(Accounts)]
pub struct WithdrawTokens<'info> {
    // User initiating the withdrawal
    #[account(mut)]
    pub user: Signer<'info>,

    // User's token account where withdrawn tokens will go
    #[account(
        mut,
        constraint = user_token_account.mint == mint.key() @ ErrorCode::InvalidMint,
        constraint = user_token_account.owner == user.key() @ ErrorCode::InvalidOwner,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // The mint of the token being withdrawn
    pub mint: Account<'info, Mint>,

    // The PDA vault account storing the locked tokens. Needs to be mutable for transfer.
    #[account(
        mut,
        seeds = [b"vault_token".as_ref(), lock_account.key().as_ref()],
        bump, // Vault bump is derived from its seeds
        token::mint = mint, // Check mint matches
        token::authority = lock_account, // Check PDA is authority
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    // The PDA account storing lock metadata. Needs to be mutable to update amount.
    // Constraint ensures the signer `user` matches the user stored in the lock account.
    #[account(
        mut,
        seeds = [b"lock_account".as_ref(), user.key().as_ref(), mint.key().as_ref()],
        bump = lock_account.bump, // Use stored bump
        has_one = user @ ErrorCode::InvalidOwner, // Crucial check: signer must be the owner stored in account
        has_one = mint @ ErrorCode::InvalidMint,   // Check mint matches the one stored
    )]
    pub lock_account: Account<'info, LockAccount>,

    // System Programs
    pub token_program: Program<'info, Token>,
}

// --- State Account ---

#[account]
pub struct LockAccount {
    pub user: Pubkey,     // 32 bytes - User who owns the lock
    pub mint: Pubkey,     // 32 bytes - Mint of the locked token
    pub amount: u64,      // 8 bytes - Total locked amount
    pub unlock_time: i64, // 8 bytes - Unix timestamp for unlock
    pub bump: u8,         // 1 byte - Bump seed for the PDA
}

impl LockAccount {
    // Calculate space needed: 8 (discriminator) + 32 + 32 + 8 + 8 + 1
    const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

// --- Events ---
#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub deposited_amount: u64,
    pub total_locked_amount: u64,
    pub unlock_time: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub withdrawn_amount: u64,
}

// --- Errors ---

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Unlock time must be in the future.")]
    UnlockTimeInPast,
    #[msg("New unlock time must be greater than or equal to the current unlock time.")]
    UnlockTimeMustBeGreaterOrEqual,
    #[msg("Amount overflow.")]
    AmountOverflow,
    #[msg("No tokens locked for this user and mint.")]
    NoTokensLocked,
    #[msg("Funds are still locked.")]
    StillLocked,
    #[msg("Invalid token mint provided.")]
    InvalidMint,
    #[msg("Account owner mismatch.")]
    InvalidOwner,
    #[msg("Failed to get bump seed.")]
    BumpError,
}
