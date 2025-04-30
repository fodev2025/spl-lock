/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lock.json`.
 */
export type Lock = {
  address: "5jKxDWd1aJz9QLhtqZGQACvmKW1PUHdH39MtdPKJnsFt";
  metadata: {
    name: "lock";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "deposit";
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
      accounts: [
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "userTokenAccount";
          writable: true;
        },
        {
          name: "mint";
        },
        {
          name: "vaultTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116, 95, 116, 111, 107, 101, 110];
              },
              {
                kind: "account";
                path: "lockAccount";
              }
            ];
          };
        },
        {
          name: "lockAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [108, 111, 99, 107, 95, 97, 99, 99, 111, 117, 110, 116];
              },
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "unlockTime";
          type: "i64";
        }
      ];
    },
    {
      name: "withdraw";
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34];
      accounts: [
        {
          name: "user";
          writable: true;
          signer: true;
          relations: ["lockAccount"];
        },
        {
          name: "userTokenAccount";
          writable: true;
        },
        {
          name: "mint";
          relations: ["lockAccount"];
        },
        {
          name: "vaultTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116, 95, 116, 111, 107, 101, 110];
              },
              {
                kind: "account";
                path: "lockAccount";
              }
            ];
          };
        },
        {
          name: "lockAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [108, 111, 99, 107, 95, 97, 99, 99, 111, 117, 110, 116];
              },
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "lockAccount";
      discriminator: [223, 64, 71, 124, 255, 86, 118, 192];
    }
  ];
  events: [
    {
      name: "depositEvent";
      discriminator: [120, 248, 61, 83, 31, 142, 107, 144];
    },
    {
      name: "withdrawEvent";
      discriminator: [22, 9, 133, 26, 160, 44, 71, 192];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "zeroAmount";
      msg: "Deposit amount must be greater than zero.";
    },
    {
      code: 6001;
      name: "unlockTimeInPast";
      msg: "Unlock time must be in the future.";
    },
    {
      code: 6002;
      name: "unlockTimeMustBeGreaterOrEqual";
      msg: "New unlock time must be greater than or equal to the current unlock time.";
    },
    {
      code: 6003;
      name: "amountOverflow";
      msg: "Amount overflow.";
    },
    {
      code: 6004;
      name: "noTokensLocked";
      msg: "No tokens locked for this user and mint.";
    },
    {
      code: 6005;
      name: "stillLocked";
      msg: "Funds are still locked.";
    },
    {
      code: 6006;
      name: "invalidMint";
      msg: "Invalid token mint provided.";
    },
    {
      code: 6007;
      name: "invalidOwner";
      msg: "Account owner mismatch.";
    },
    {
      code: 6008;
      name: "bumpError";
      msg: "Failed to get bump seed.";
    }
  ];
  types: [
    {
      name: "depositEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "depositedAmount";
            type: "u64";
          },
          {
            name: "totalLockedAmount";
            type: "u64";
          },
          {
            name: "unlockTime";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "lockAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "unlockTime";
            type: "i64";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "withdrawEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "withdrawnAmount";
            type: "u64";
          }
        ];
      };
    }
  ];
};
