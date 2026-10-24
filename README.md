# aisite-starter

> **siuserxiaowei 团队出品的 AI 工具站与特效站全栈模板**
>
> 仓库地址：[https://github.com/siuserxiaowei/aisite-starter](https://github.com/siuserxiaowei/aisite-starter)

我们自己的 AI 工具站模板。用它可以快速开这三种站：

- **热词特效站**：一个玩法一个站，比如「照片变 PS2 角色视频」。追热词时一两天就能上线
- **AI 视频站**：图生视频、文生视频，加一批一键视频特效
- **AI 图片站**：文生图、改图，加一批照片特效

## 这个仓库是什么

一份「开箱就能收钱」的 AI 生成站底子。每开一个新站，就把这个仓库复制一份，改配置和文案，不用重写功能。

它由三层组成：

1. **底座**（TanStack Start 全栈）：注册登录、积分、支付（Creem / Stripe 等）、管理后台、中英文、博客、SEO，跑在 Cloudflare Workers + D1 + R2
2. **生成层**（我们自己写的，配置驱动）：
   - `src/config/ai/models.ts` 模型目录：接哪些 HiAPI 模型、每个模型的参数怎么填、每次生成扣多少积分
   - `src/config/ai/tools.ts` 工具和特效：文生图、改图、图生视频、文生视频、一键特效、两步特效（先出图再转视频）
   - 通用生成引擎：服务端算价 → 扣积分 → 调模型 → 存结果；主模型失败自动换备用模型，还失败就退积分
   - 通用工作台：表单按配置自动出，换模型价格实时变
   - 每个工具、特效、模型自动生成独立页面（`/tools/…`、`/effects/…`、`/models/…`）并进 sitemap，用来做搜索流量
3. **设计**（popstyle）：暖色底、衬线强调标题、毛玻璃导航、作品墙、入场动画，深浅色和手机都适配

## 怎么用

- 开新站的完整步骤见 [STARTER.md](STARTER.md)
- 用 Claude Code 或 Codex 时，直接说「上新站：某某热词」，仓库自带的 `new-ai-site` 技能会按流程做
- 改完运行 `pnpm site:check`，列出新站还有哪些地方没改

常用命令：

| 命令                           | 作用                                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| `pnpm dev`                     | 本地起站（`.env.development` 里加 `GENERATOR_MOCK=1` 不花钱测试） |
| `pnpm test:ai`                 | 检查模型和工具配置、价格计算、参数映射                            |
| `pnpm ai:model <HiAPI 模型名>` | 从 HiAPI 模型清单生成一条模型配置草稿                             |
| `pnpm site:check`              | 上线前检查还没改完的地方                                          |
| `pnpm build`                   | 构建                                                              |

## 技术栈

- TanStack Start（React 19、Vite、TypeScript 严格模式），文件路由在 `src/routes/`
- Tailwind CSS 4 + shadcn/ui 组件，设计变量在 `src/styles/popstyle.css`
- better-auth 登录（邮箱密码、Google、GitHub）
- Drizzle ORM，本地用 SQLite，线上用 Cloudflare D1（也支持 Postgres、MySQL）
- 支付：Stripe、Creem、PayPal、支付宝、微信支付，积分按先进先出消耗，失败退款
- 多语言：Paraglide，文案在 `messages/en.json`、`messages/zh.json`
- AI：HiAPI 异步任务接口（`src/core/ai/hiapi.ts`）

## 本地起站

```bash
pnpm install
cp .env.example .env.development   # 填 AUTH_SECRET、CONFIG_ENCRYPTION_KEY，加 GENERATOR_MOCK=1
pnpm db:push
pnpm rbac:init --admin-email=you@example.com --admin-password=<密码>
pnpm dev
```

`/admin` 是管理后台，支付、登录方式、邮件、存储、AI 密钥都在 后台 → 设置 里配，存在数据库里（设置了 `CONFIG_ENCRYPTION_KEY` 会加密）

## 目录

| 目录                    | 放什么                                                     |
| ----------------------- | ---------------------------------------------------------- |
| `src/config/ai/`        | 模型目录、工具和特效配置（开新站主要改这里）               |
| `src/config/site.ts`    | 首页默认工具、作品墙                                       |
| `src/config/pricing.ts` | 积分包价格                                                 |
| `src/modules/`          | 业务逻辑（积分、支付、AI 任务、配置等），每个模块独立      |
| `src/core/`             | 基础设施（数据库、登录、支付、存储、AI 供应商）            |
| `src/blocks/`           | 页面区块（读文案、拼组件）                                 |
| `src/components/`       | 通用组件（内容全靠 props 传入）                            |
| `src/routes/`           | 页面和接口                                                 |
| `.claude/skills/`       | 给 Claude Code、Codex 用的技能（开新站、部署、上线检查等） |

给 AI 助手看的详细约定在 [AGENTS.md](AGENTS.md)

## 维护与同步

- 本模板由 **siuserxiaowei** ([@siuserxiaowei](https://github.com/siuserxiaowei)) 维护与演进
- 模板本身的修复和新功能先改这里，再合并到各个站点仓库（站点仓库把 `https://github.com/siuserxiaowei/aisite-starter.git` 设为 `upstream`，用 `git merge upstream/main` 同步）
- 开箱即用，不要提交 `.env.*` 和 `data/`，里面包含私有密钥和本地数据库
