---
name: new-ai-site
description: 用我们自己的 AI 工具站模板（~/work/aisite-starter）开一个新站，图片站、视频站、热词特效站都行。用户说「上新站」「用模板开个站」「做一个 XX 的 AI 工具站」「新热词建站」，或者要做出图、出视频、一键特效的站时使用
---

# 用模板开新站

模板在 ~/work/aisite-starter，先完整读它的 STARTER.md，再读 src/config/ai/types.ts 和 tools.ts

## 1. 先问清楚（缺什么问什么，一次问完）

- 热词或站名、计划用的域名
- 站型：热词特效站（一个玩法）、视频站、图片站
- 玩法：照片要变成什么样，或者要生成什么（参考图、参考视频或一句话）
- 品牌色倾向（不确定就按热词气质从 popstyle 的四组预设里挑）

## 2. 建仓库

```bash
cp -R ~/work/aisite-starter ~/work/<站名> && cd ~/work/<站名>
rm -rf .git data .output node_modules && git init
pnpm install
```

.env.development 按 STARTER.md 生成，密钥用 openssl rand -hex 32，加 GENERATOR_MOCK=1

## 3. 配生成层（只改配置，不改引擎）

1. 选模型：需要模板里没有的模型，用 `pnpm ai:model <HiAPI 模型名>` 生成草稿贴进 src/config/ai/models.ts，按 HiAPI 账单定价
2. 写工具和特效：src/config/ai/tools.ts。热词玩法写成 effect（提示词固定）；需要先出风格图再转视频就用 pre 两步。删掉模板示例特效 clay-figure、tiny-planet、claymation-clip
3. src/config/site.ts：HOME_TOOL、HOME_TOOLS（热词站只放一个）、SHOWCASE
4. 跑 `pnpm test:ai`

## 4. 改站点差异

1. messages/en.json 和 zh.json：landing.*、common.metadata.*，删掉所有 TODO(site)。标题写成「正文 + 强调词」，强调词放 *_em 键
2. src/config/pricing.ts 积分包
3. 品牌色：从 ~/work/popstyle-kit/assets/presets.css 复制一组，替换新站 src/styles/popstyle.css 开头的品牌色段和两处暗色底色。不要改 kit 本身
4. public/logo.svg、favicon.svg；package.json 的 name；wrangler.jsonc

## 5. 真实效果先测

有 HiAPI key 就用 3 到 5 张授权照片（如 Wikimedia CC0）跑每个工具和特效，挑效果好的放进 public/samples，登记到 SHOWCASE 和特效 preview。没有 key 就保留占位，并告诉用户上线前必须补

## 6. 验收（自己做完再交）

- pnpm build、pnpm exec tsc --noEmit、pnpm test:ai 通过
- pnpm db:push 后用模拟模式起站，每个工具跑一遍 注册 → 上传 → 生成 → 扣积分，扣的积分要等于工作台显示的价格；提示词带 MOCK_FAIL 验证 fallback 和退积分
- 首页、每个工具页和特效页在 1440 和 390 宽度、中英文、深浅色截图检查，没有横向滚动、没有控制台报错
- pnpm site:check 的剩余项逐条告诉用户，哪些需要用户提供（域名、key、真实作品）

## 不能做的事

- 不编造作品、评价、使用人数和划线原价
- 不改 src/modules/ai-tasks/generation.ts 的扣费和退款逻辑，除非用户明确要求；需要新能力时先在 aisite-starter 里改，再同步到各站
- 不提交 .env.* 和 data/，不替用户推送和部署，部署前先确认
