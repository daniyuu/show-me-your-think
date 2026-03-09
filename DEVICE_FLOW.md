# 🚀 GitHub Device Flow - Ready to Use!

## ✨ 新功能：OAuth Device Flow 认证

不需要复制粘贴 token！只需在浏览器点击授权即可。

## 📋 两步设置（首次使用）

### 步骤 1: 创建 GitHub OAuth App（5分钟）

1. 访问：https://github.com/settings/applications/new

2. 填写信息：
   - **Application name**: `show-me-your-think`
   - **Homepage URL**: `https://github.com/daniyuu/show-me-your-think`
   - **Authorization callback URL**: `http://127.0.0.1` *(必填，但 Device Flow 不会用到)*

3. 点击 **"Register application"**

4. 复制显示的 **Client ID**（格式：`Ov23li...`）

### 步骤 2: 配置 Client ID

**方式 A: 环境变量（推荐）**

编辑 `.env` 文件：
```env
GITHUB_OAUTH_CLIENT_ID=Ov23liYourActualClientId
ANTHROPIC_API_KEY=dummy-key
ANTHROPIC_BASE_URL=http://localhost:4141
```

**方式 B: 直接修改代码**

编辑 `packages/cli/src/github-auth.ts` 第 16 行：
```typescript
const CLIENT_ID = 'Ov23liYourActualClientId';
```

然后运行：
```bash
pnpm build
```

## 🎯 使用体验

### 首次运行

```bash
pnpm dev analyze googleworkspace/cli
```

你会看到：

```
🔐 GitHub Authentication

Opening GitHub in your browser for authentication...

┌─────────────────────────────────────┐
│  GitHub Authentication Required     │
└─────────────────────────────────────┘

Enter this code in your browser:

    WXYZ-1234

✓ Browser opened automatically

⠋ Waiting for you to approve in browser...
```

浏览器会自动打开到 GitHub 授权页面：

1. 确认代码匹配（`WXYZ-1234`）
2. 点击 **"Authorize"**
3. 回到终端，会自动继续！

```
✔ Authentication successful!
Token saved to /home/user/.smyt/github-token

🧠 Show Me Your Think
...
```

### 后续运行

```bash
pnpm dev analyze owner/repo
```

输出：
```
✓ Using saved GitHub credentials

🧠 Show Me Your Think
...
```

无需重新认证！

## 🔄 认证流程图

```
运行 analyze 命令
       ↓
检查是否有缓存的 token
       ↓ 无
检查是否配置了 OAuth Client ID
       ↓ 是
启动 Device Flow
       ↓
显示授权码（如 WXYZ-1234）
       ↓
自动打开浏览器到 github.com/login/device
       ↓
用户在浏览器中：
  1. 确认代码
  2. 点击 Authorize
       ↓
CLI 自动检测授权完成
       ↓
保存 token 到 ~/.smyt/github-token
       ↓
继续分析...
```

## 🛠️ 故障排除

### "OAuth Device Flow not configured"

你需要设置 `GITHUB_OAUTH_CLIENT_ID`：

1. 按照上面"步骤 1"创建 OAuth App
2. 设置环境变量或修改代码
3. 运行 `pnpm build`

或者跳过 OAuth，使用手动 token 模式（系统会自动回退）。

### 浏览器未自动打开

复制终端显示的链接：
```
https://github.com/login/device
```

手动在浏览器打开，输入显示的代码。

### "Invalid client" 错误

检查 Client ID 是否正确：
- 应该以 `Ov23li` 开头
- 长度约 20 个字符
- 没有多余的空格

### Token 过期

运行：
```bash
pnpm dev logout
pnpm dev analyze owner/repo
```

会重新进行认证。

## 🆚 对比：传统方式 vs Device Flow

### 传统方式（手动 Token）
```
1. 访问 GitHub settings
2. 创建 Personal Access Token
3. 复制 token
4. 粘贴到 .env 文件
5. 运行命令
```

### Device Flow（OAuth）
```
1. 配置 OAuth Client ID（仅一次）
2. 运行命令
3. 浏览器弹出 → 点击授权
4. 完成！
```

## 💡 Pro Tips

### 多账户切换

```bash
# 切换账户
pnpm dev logout
pnpm dev analyze owner/repo
# 重新授权
```

### CI/CD 环境

在 CI/CD 中使用传统 token（Device Flow 需要交互）：

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 临时使用（不保存）

Device Flow 会自动保存 token。如需一次性使用，用传统方式：

```bash
pnpm dev analyze owner/repo --github-token ghp_xxx
```

## 🔒 安全说明

- **Client ID 是公开的**：可以安全地提交到 Git
- **Token 是私密的**：存储在 `~/.smyt/github-token`（权限 600）
- **授权范围**：仅请求 `repo` 和 `public_repo` 权限
- **可随时撤销**：访问 https://github.com/settings/connections/applications

## 📚 相关文档

- [OAUTH_SETUP.md](OAUTH_SETUP.md) - 详细 OAuth 设置指南
- [INTERACTIVE_LOGIN.md](INTERACTIVE_LOGIN.md) - 手动 token 模式文档
- [README.md](README.md) - 项目总览

---

**现在就试试！** 🎉

```bash
# 1. 设置 OAuth Client ID
export GITHUB_OAUTH_CLIENT_ID=Ov23liYourClientId

# 2. 运行分析
pnpm dev analyze googleworkspace/cli
```
