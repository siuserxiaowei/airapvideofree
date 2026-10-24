// 从 HiAPI 模型清单生成一条 models.ts 草稿。用法：pnpm ai:model kling-3.0-turbo/image-to-video
// 只打印，不改文件；参数名和可选值照抄 HiAPI，价格和介绍要自己填
const id = process.argv[2];
if (!id) {
  console.log(
    '用法：pnpm ai:model <HiAPI 模型名>，例如 kling-3.0-turbo/image-to-video'
  );
  process.exit(1);
}
const res = await fetch('https://www.hiapi.ai/docs/models.json');
const { models } = await res.json();
const m = models.find((x) => x.id === id);
if (!m) {
  const near = models
    .filter((x) => x.id.includes(id.split('/')[0]))
    .map((x) => x.id);
  console.log(`没找到 ${id}。相近的：${near.join('、') || '无'}`);
  process.exit(1);
}

// HiAPI 参数名 → 统一字段
const MAP = {
  prompt: 'prompt',
  negative_prompt: 'negativePrompt',
  image_url: 'image',
  image_urls: 'image',
  first_frame_url: 'image',
  input_urls: 'image',
  image_input: 'images',
  reference_image_urls: 'images',
  last_frame_url: 'endImage',
  aspect_ratio: 'aspectRatio',
  resolution: 'resolution',
  duration: 'duration',
  generate_audio: 'audio',
  audio: 'audio',
};
const cap = m.capability.toLowerCase();
const task =
  m.category === 'video'
    ? cap.includes('image-to-video') ||
      m.input.some((f) => /image_url|first_frame/.test(f.name))
      ? 'image-to-video'
      : 'text-to-video'
    : cap.includes('image-to-image') || cap.includes('edit')
      ? 'image-edit'
      : 'text-to-image';

const fields = [];
const skipped = [];
for (const f of m.input) {
  const key = MAP[f.name];
  if (!key || fields.some((x) => x.key === key)) {
    skipped.push(f.name);
    continue;
  }
  const parts = [`param: '${f.name}'`];
  if (f.required) parts.push('required: true');
  if (f.type === 'string[]') parts.push('array: true');
  if (f.enum)
    parts.push(`options: ${JSON.stringify(f.enum).replace(/"/g, "'")}`);
  else if (key === 'duration')
    parts.push('options: [5, 10] /* TODO 按文档核对可选秒数 */');
  if (f.default !== undefined && f.default !== '[]')
    parts.push(`default: ${JSON.stringify(f.default).replace(/"/g, "'")}`);
  fields.push({ key, line: `      ${key}: { ${parts.join(', ')} },` });
}
const slug = id
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/-+$/, '');
console.log(`  {
    id: '${slug}',
    provider: 'hiapi',
    providerModel: '${m.id}',
    label: '${m.title.replace(/ API$/, '').replace(/'/g, "\\'")}',
    vendor: 'TODO',
    kind: '${m.category === 'video' ? 'video' : 'image'}',
    task: '${task}',
    fields: {
${fields.map((x) => x.line).join('\n')}
    },
    // TODO: 按 HiAPI 账单定价（1 积分 = USD_PER_CREDIT 美元）
    price: { per: '${m.category === 'video' ? 'second' : 'image'}', credits: 0 },
    summary: {
      en: '${m.summary.replace(/'/g, "\\'").slice(0, 140)}',
      zh: 'TODO',
    },
  },`);
if (skipped.length)
  console.log(`\n// 没映射的参数（需要的话放进 fixed）：${skipped.join(', ')}`);
console.log(`// 文档：${m.docsZh || m.docs}`);
