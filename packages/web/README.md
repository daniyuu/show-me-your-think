# Show Me Your Think - Web Dashboard

Web 界面，让你在浏览器中分析 GitHub 仓库。

## 🚀 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并设置：

- `GITHUB_TOKEN`: GitHub Personal Access Token ([获取地址](https://github.com/settings/tokens))
- `ANTHROPIC_API_KEY`: Anthropic API Key (或使用 `dummy-key` + 本地代理)
- `ANTHROPIC_BASE_URL`: 自定义 API 端点 (可选，例如: `http://localhost:4141`)

### 2. 启动开发服务器

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

### 3. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用说明

1. 在输入框中输入 GitHub 仓库地址（格式：`owner/repo`）
2. 设置活跃天数阈值（默认 30 天）
3. 点击"开始分析"按钮
4. 等待分析完成（通常需要几分钟）
5. 查看分析结果，可下载 Markdown 报告

## 🏗️ 技术栈

- **Next.js 15** - React 框架
- **React 19** - UI 库
- **Tailwind CSS** - 样式
- **TypeScript** - 类型安全
- **@smyt/core** - 核心分析引擎

## 📝 与 CLI 的区别

- **CLI**: 使用 OAuth Device Flow 认证，浏览器授权
- **Web**: 使用服务端 GitHub Token，无需用户授权

## 🔒 安全提示

- `.env.local` 文件包含敏感信息，已在 `.gitignore` 中排除
- GitHub Token 仅在服务端使用，不会暴露给前端
- 建议在生产环境使用环境变量而非 `.env.local`

## 🎨 界面截图

- 简洁的输入表单
- 实时加载状态
- 漂亮的分析结果展示
- 支持深色模式
- 可下载 Markdown 报告
