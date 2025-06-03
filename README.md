# 使用说明

本项目使用 Anchor 框架进行 Solana 程序的开发和部署。以下是一些常用命令的说明：

## 常用命令

### 1. 编译程序
使用以下命令编译 Solana 程序：
```bash
anchor build
```
### 2. 部署程序
使用以下命令将程序部署到 Solana 网络：
```bash
anchor deploy
```
### 3. 运行测试
使用以下命令运行 Solana 程序的测试：
```bash
anchor test
```
### 4. 查看账户状态
使用以下命令查看 Solana 账户的状态：
```bash
anchor accounts
```
### 5. 清理项目
使用以下命令清理项目：
```bash
anchor clean
``` 
### 6. 同步program id
使用以下命令同步program id：
```bash
anchor keys sync
```
### 7. devnet 测试
使用以下命令在 devnet 上测试：
```bash
anchor run lock
anchor run unlock
```

### 8. 关闭升级权限
使用以下命令关闭升级权限：
```bash
solana program set-upgrade-authority <PROGRAM_ID> --final
或者
solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <NEW_AUTHORITY_PUBKEY>
<NEW_AUTHORITY_PUBKEY> 是新的升级权限账户的公钥。要关闭升级权限，你需要将其设置为 UpgradeAuthority 程序的特殊地址 11111111111111111111111111111111 （System Program ID），或者使用 --final 标志，这会将升级权限设置为 None 。
NEW_AUTHORITY_PUBKEY为11111111111111111111111111111111
```

### 9.主网上线
使用以下命令在主网上线：
Program Id: 6o1UQjdJXtQWLEMFckDhCzaBAhNEY4wzTnJs9DejqC2M

Signature: 5hjCM2nurnjdzZoaJesCiPehH7AqK7vmeWg2Qhe3VjcbFmJFy15Kmw5yLpCeFrS6kYa9AiYd8AcV9Eg3bY2inEnE

Deploy success
```bash
anchor deploy --provider.cluster mainnet
solana program set-upgrade-authority 6o1UQjdJXtQWLEMFckDhCzaBAhNEY4wzTnJs9DejqC2M --final --provider.cluster mainnet

```