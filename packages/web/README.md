# Show Me Your Think - Web Dashboard

Web 界面，让你在浏览器中分析 GitHub 仓库。使用 **OAuth 2.0 Authorization Code Flow** 进行认证，无需手动填写 token！

## 🚀 快速开始

### 1. 创建 GitHub OAuth App

访问：https://github.com/settings/applications/new

填写信息：
- **Application name**: `show-me-your-think`
- **Homepage URL**: `http://localhost:3000` (开发环境)
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback`

点击 "Register application" 后，复制：
- **Client ID**
- **Client secret**

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并设置：

```env
# GitHub OAuth (必需)
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret

# Anthropic (必需，或使用本地代理)
ANTHROPIC_API_KEY=dummy-key
ANTHROPIC_BASE_URL=http://localhost:4141
MODEL=claude-opus-4.6
```

### 3. 启动开发服务器

```bash
# 在项目根目录
pnpm install
pnpm --filter @smyt/web dev
```

或者在 web 目录：

```bash
cd packages/web
pnpm dev
```

### 4. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用说明

1. 点击右上角 "GitHub 登录" 按钮
2. 在 GitHub 授权页面点击 "Authorize"
3. 自动返回应用，显示你的用户信息
4. 输入 GitHub 仓库地址（格式：`owner/repo`）
5. 设置活跃天数阈值
6. 点击"开始分析"按钮
7. 查看分析结果，可下载 Markdown 报告

## 🔐 认证流程

采用标准 OAuth 2.0 Authorization Code Flow：

```
用户点击"GitHub 登录"
  ↓
重定向到 /api/auth/github
  ↓
重定向到 GitHub 授权页面
  ↓
用户授权
  ↓
GitHub 回调到 /api/auth/callback
  ↓
后端交换 code 获取 access_token
  ↓
重定向到 /oauth-callback 并传递 token
  ↓
前端保存 token 到 localStorage
  ↓
完成！可以开始分析
```

**优势：**
- ✅ 无需手动复制粘贴 token
- ✅ 标准 OAuth 流程，安全可靠
- ✅ Token 自动保存，无需每次登录
- ✅ 支持登出功能

## 🏗️ 技术栈

- **Next.js 15** - React 框架
- **React 19** - UI 库
- **Tailwind CSS** - 样式
- **TypeScript** - 类型安全
- **@smyt/core** - 核心分析引擎
- **GitHub OAuth 2.0** - 认证

## 📝 与 CLI 的区别

| 特性 | CLI | Web |
|-----|-----|-----|
| 认证方式 | OAuth Device Flow | OAuth Authorization Code Flow |
| 界面 | 命令行 | 浏览器 |
| Token 存储 | ~/.smyt/github-token | localStorage |
| 适用场景 | 本地开发、脚本 | 团队协作、可视化 |

## 🔒 安全提示

- `.env.local` 文件包含敏感信息，已在 `.gitignore` 中排除
- `GITHUB_OAUTH_CLIENT_SECRET` 仅在服务端使用，不会暴露给前端
- Token 存储在 localStorage（前端），通过 Authorization header 传递
- 建议在生产环境使用环境变量而非 `.env.local`
- 生产环境需要配置正确的回调 URL

## 🎨 界面截图

- ✨ 简洁现代的设计
- 🌓 支持深色模式
- 📱 响应式布局
- 👤 用户信息展示
- 🔍 实时分析反馈
- 📊 数据可视化
