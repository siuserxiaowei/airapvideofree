// 上线前检查：列出还没改完的站点差异。用法：pnpm site:check
// 只读，不改任何文件。有问题时退出码为 1
import { existsSync, readFileSync } from 'node:fs';

const problems = [];
const warn = (msg) => problems.push(msg);
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');

// 1. 文案和配置里的 TODO(site)
for (const f of [
  'src/config/generator.ts',
  'src/config/pricing.ts',
  'messages/en.json',
  'messages/zh.json',
]) {
  read(f)
    .split('\n')
    .forEach((line, i) => {
      if (line.includes('TODO(site)'))
        warn(`${f}:${i + 1} 还有待填内容：${line.trim().slice(0, 80)}`);
    });
}

// 2. 作品墙不能是空的
const site = read('src/config/site.ts');
if (/export const SHOWCASE: ShowcaseItem\[\] = \[\];/.test(site))
  warn(
    'src/config/site.ts 的 SHOWCASE 还是空的，首页作品墙只有占位色块。放几件真实生成的作品'
  );

// 3. 模板自带的示例特效和没定价的模型
const tools = read('src/config/ai/tools.ts');
for (const demo of ['clay-figure', 'tiny-planet', 'claymation-clip'])
  if (tools.includes(`id: '${demo}'`))
    warn(`src/config/ai/tools.ts 里还有模板示例特效 ${demo}，换成本站的或删掉`);
if (/credits: 0\b/.test(read('src/config/ai/models.ts')))
  warn('src/config/ai/models.ts 里有模型价格还是 0');
if (!/preview:/.test(tools))
  warn(
    'src/config/ai/tools.ts 的工具和特效都没有 preview 示例图，卡片只有色块'
  );

// 4. 名字和部署配置
const pkg = JSON.parse(read('package.json') || '{}');
if (['aisite-starter'].includes(pkg.name))
  warn(`package.json 的 name 还是 ${pkg.name}`);
const wrangler = read('wrangler.jsonc');
if (!wrangler)
  warn('还没有 wrangler.jsonc（从 wrangler.example.jsonc 复制并改名）');
else if (/aisite-starter|aisite-db/.test(wrangler))
  warn('wrangler.jsonc 里还有模板的 worker 或数据库名');

// 5. 环境变量
const prod = read('.env.production');
if (/GENERATOR_MOCK=\S/.test(prod))
  warn('.env.production 里不能开 GENERATOR_MOCK');
for (const f of ['.env.production', '.env.development']) {
  const name = (read(f).match(/^VITE_APP_NAME=(.*)$/m) || [])[1];
  if (name && ['My App', 'ClayMe'].includes(name.trim()))
    warn(`${f} 的 VITE_APP_NAME 还是模板默认值 ${name}`);
}

if (problems.length) {
  console.log(`还有 ${problems.length} 项没改完：\n`);
  problems.forEach((p, i) => console.log(`${i + 1}. ${p}`));
  process.exit(1);
}
console.log('站点检查通过');
