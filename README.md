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