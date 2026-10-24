# AI 工具站模板（aisite-starter by siuserxiaowei）

siuserxiaowei 团队自研的建站模板（https://github.com/siuserxiaowei/aisite-starter），图片站、视频站、单个热词特效站都用它。

## 结构

- 底座：TanStack Start 全栈（登录、支付、积分、后台、中英文、博客、SEO），跑在 Cloudflare Workers + D1
- 生成层：配置驱动，不写死任何一种玩法
  - `src/config/ai/models.ts` 模型目录：用哪些 HiAPI 模型、统一字段对应的参数名、积分价格
  - `src/config/ai/tools.ts` 工具和特效：文生图、改图、图生视频、文生视频、一键特效、两步特效
  - `src/modules/ai-tasks/generation.ts` 通用引擎：校验 → 服务端算价 → 扣积分 → 按步骤调模型 → 存 R2；主模型失败自动换 fallback 重试一次，还失败就退积分
  - `src/blocks/studio.tsx` 通用工作台：表单按工具和模型自动出（首帧、尾帧、参考图、提示词、画幅、清晰度、时长、声音），换模型价格实时变
- 页面：每个工具自动有 `/tools/<id>`，每个特效有 `/effects/<id>`，每个模型有 `/models/<id>`，全部进 sitemap（这是 pollo、popnow 这类站的主要流量来源）
- 设计：popstyle（`~/work/popstyle-kit`）

## 三种站，怎么配

| 站型                       | `config/site.ts`                                         | `config/ai/tools.ts`                                                       |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| 热词特效站（如 losercore） | `HOME_TOOLS` 只放这个特效                                | 写 1 个特效（需要先出图再转视频就用 `pre` 两步），其他工具删掉或留着做内页 |
| 视频站                     | `HOME_TOOLS = ['image-to-video', 'text-to-video']`       | 通用工具 + 一批视频特效，每个特效一个页面                                  |
| 图片站                     | `HOME_TOOLS = ['ai-image-generator', 'ai-photo-editor']` | 图片工具 + 一批图片特效                                                    |

## 加模型、加工具、加特效

- 加模型：`pnpm ai:model <HiAPI 模型名>` 打印一条草稿（参数名和可选值照抄 HiAPI 清单），贴进 `models.ts`，填价格、厂商、中文介绍
- 加工具：在 `tools.ts` 加一条 `type: 'tool'`，列出可选模型，写中英文案
- 加特效：加一条 `type: 'effect'`，`promptTemplate` 写死提示词（不含 `{prompt}` 就不显示提示词框），`hidden` 里放不让用户改的选项，`preview` 放示例图或视频
- 改完跑 `pnpm test:ai`：检查每个工具的模型存在、任务类型一致、id 不重复、价格和参数映射正确

## 上新站要改的地方

| 改什么                      | 在哪                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 工具、特效、首页默认工具    | `src/config/ai/tools.ts`、`src/config/site.ts`                                                                                                  |
| 模型和每次生成的积分价      | `src/config/ai/models.ts`                                                                                                                       |
| 积分包价格                  | `src/config/pricing.ts`（价格页直接读这里）                                                                                                     |
| 首页和 SEO 文案（中英两份） | `messages/en.json`、`messages/zh.json` 的 `landing.*`、`common.metadata.*`                                                                      |
| 首页作品墙                  | `src/config/site.ts` 的 `SHOWCASE`，只放真实生成的作品                                                                                          |
| 站名、域名                  | `.env.development`、`.env.production` 的 `VITE_APP_NAME`、`VITE_APP_URL`                                                                        |
| 品牌色                      | 从 `~/work/popstyle-kit/assets/presets.css` 复制一组，替换本站 `src/styles/popstyle.css` 开头「品牌色」那几行（暗色底色在同文件的两处暗色块里） |
| Logo                        | `public/logo.svg`、`public/favicon.svg`                                                                                                         |
| Cloudflare 资源名           | 复制 `wrangler.example.jsonc` 为 `wrangler.jsonc`，改 worker、D1、R2 名                                                                         |

改完运行 `pnpm site:check`，它会列出所有还没改的地方，全部清掉才算能上线

## 本地起站（免费模拟模式）

```bash
cp -R ~/work/aisite-starter ~/work/<新站名> && cd ~/work/<新站名>
rm -rf .git data .output node_modules && git init
pnpm install
cp .env.example .env.development      # 填 AUTH_SECRET、CONFIG_ENCRYPTION_KEY（openssl rand -hex 32），加一行 GENERATOR_MOCK=1
pnpm db:push
pnpm dev
```

- `GENERATOR_MOCK=1`：不调真实模型，6 秒后返回示例结果；提示词里带 `MOCK_FAIL` 的任务会失败（测 fallback 和退积分）
- `GENERATOR_MOCK=fail`：所有任务失败
- 正式构建里模拟模式无论怎么设都不生效
- 新用户送积分：后台 设置 → 通用 → 积分 打开「注册送积分」。1 积分 = 0.01 美元，送 50 到 100 够试几张图
- 后台配置有 1 小时缓存，直接改数据库后要重启 dev

## 接真实模型前

1. 后台 设置 → AI → HiAPI 填 key
2. 每个工具和特效用 3 到 5 张授权照片（如 Wikimedia CC0）真实跑一遍，看效果再定提示词
3. 对照 HiAPI 账单核对 `models.ts` 里的积分价，保证每次生成有利润
4. 挑效果好的结果放进 `SHOWCASE` 和特效的 `preview`

## 上线顺序

HiAPI key → R2 → 支付（Creem 或 Stripe，商品 id 对应 `pricing.ts` 的 key）→ Google 登录 → `pnpm site:check` 通过 → 部署 Cloudflare（仓库自带 deploy-cloudflare 技能）→ 提交 GSC 和 IndexNow

## 已验证（2026-10-22）

- `pnpm build`、`tsc --noEmit`、`pnpm test:ai`（10 项）通过
- 模拟模式下 7 种生成全部跑通，扣费和工作台显示一致：文生图 2K 18、GPT Image 8、改图 12、Seedance 480p 10 秒 40、Veo 8 秒 240、小星球特效 35、两步定格动画 12+35=47
- 用户改特效隐藏的时长无效，按配置算价；没传照片、传外站图片、不存在的工具都在扣费前拒绝
- 主模型失败后自动换海螺重试一次，还失败就全额退积分
- 浏览器里切换工具、模型、清晰度、时长，价格实时变化；上传 → 生成 → 结果和历史正常显示
- 首页、工具页、特效页、模型页、特效总览、价格页在 1440 和 390 宽度、深浅色下无横向滚动、无控制台报错

## 不能做的事

- 不编造作品、评价、使用人数和划线原价；作品墙只放真实生成的结果
- 不照搬别人站的品牌色、Logo、文案和图片
- 价格只在服务端算；浏览器只能传工具 id、模型 id 和用户输入
- `.env.*` 和 `data/` 不进 git，里面有密钥和本地管理员密码
