// 模型目录和工具配置的纯函数测试：价格、输入校验、供应商参数映射
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getModel,
  getTool,
  modelPrice,
  MODELS,
  providerInput,
  resolveValues,
  toolPrice,
  TOOLS,
  visibleFields,
} from '../src/config/ai';

test('every tool points at existing models of the same task', () => {
  for (const t of TOOLS) {
    assert.ok(t.models.length > 0, t.id);
    for (const id of t.models) {
      const m = getModel(id);
      assert.ok(m, `${t.id} → ${id}`);
      assert.equal(m!.task, t.task, `${t.id} → ${id} task`);
    }
    if (t.pre) assert.ok(getModel(t.pre.model), `${t.id} pre`);
    assert.ok(
      t.copy.en.name &&
        t.copy.zh.name &&
        t.copy.en.description &&
        t.copy.zh.description,
      t.id
    );
  }
});

test('fallback models exist and match kind and task', () => {
  for (const m of MODELS) {
    if (!m.fallback) continue;
    const fb = getModel(m.fallback);
    assert.ok(fb, m.id);
    assert.equal(fb!.task, m.task);
    assert.equal(fb!.kind, m.kind);
  }
});

test('ids are unique and url-safe', () => {
  const ids = [
    ...MODELS.map((m) => `m:${m.id}`),
    ...TOOLS.map((t) => `t:${t.id}`),
  ];
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [...MODELS.map((m) => m.id), ...TOOLS.map((t) => t.id)])
    assert.match(id, /^[a-z0-9-]+$/);
});

test('per-second price uses duration and resolution tier', () => {
  const m = getModel('seedance-2-0-mini')!;
  assert.equal(modelPrice(m, { duration: 5, resolution: '720p' }), 40);
  assert.equal(modelPrice(m, { duration: 10, resolution: '480p' }), 40);
  assert.equal(modelPrice(m, {}), 40); // 默认 5 秒 × 8
});

test('per-image price uses resolution tier', () => {
  const m = getModel('nano-banana-2')!;
  assert.equal(modelPrice(m, { resolution: '1K' }), 12);
  assert.equal(modelPrice(m, { resolution: '4K' }), 30);
});

test('two-step tool charges both steps', () => {
  const t = getTool('rap-star-clip')!;
  const main = getModel(t.models[0])!;
  const { values } = resolveValues(t, main, {
    image: '/uploads/' + 'a'.repeat(32) + '.png',
  });
  assert.equal(toolPrice(t, main, values), 12 + 35);
});

test('options outside the allowed list fall back to the default', () => {
  const t = getTool('image-to-video')!;
  const m = getModel('kling-2-5-turbo-i2v')!;
  const { values } = resolveValues(t, m, {
    duration: 999,
    aspectRatio: 'evil',
    prompt: 'x',
  });
  assert.equal(values.duration, 5);
  assert.equal(values.aspectRatio, '16:9');
});

test('hidden fields ignore user input and use tool defaults', () => {
  const t = getTool('hotel-lobby-rap')!;
  const m = getModel(t.models[0])!;
  const { values } = resolveValues(t, m, {
    duration: 10,
    image: '/uploads/x.png',
  });
  assert.equal(values.duration, 5);
  assert.equal(values.aspectRatio, '9:16');
  assert.ok(!visibleFields(t, m).includes('duration'));
  assert.ok(
    !visibleFields(t, m).includes('prompt'),
    'effects have no prompt box'
  );
});

test('missing photo and missing prompt are reported', () => {
  const i2v = getTool('image-to-video')!;
  assert.deepEqual(
    resolveValues(i2v, getModel(i2v.models[0])!, { prompt: 'x' }).errors,
    ['image']
  );
  const t2v = getTool('text-to-video')!;
  assert.deepEqual(resolveValues(t2v, getModel(t2v.models[0])!, {}).errors, [
    'prompt',
  ]);
});

test('provider input maps unified fields to each model’s params', () => {
  const kling = getModel('kling-2-5-turbo-i2v')!;
  assert.deepEqual(
    providerInput(
      kling,
      { image: 'https://x/a.png', duration: 5, aspectRatio: '9:16' },
      'p'
    ),
    {
      prompt: 'p',
      image_urls: ['https://x/a.png'],
      duration: 5,
      aspect_ratio: '9:16',
    }
  );
  const hailuo = getModel('hailuo-2-3-fast-i2v')!;
  assert.deepEqual(
    providerInput(hailuo, { image: 'https://x/a.png', duration: 6 }, 'p'),
    {
      prompt_optimizer: false,
      prompt: 'p',
      image_url: 'https://x/a.png',
      duration: '6',
    }
  );
  const nano = getModel('nano-banana-2')!;
  const input = providerInput(
    nano,
    { images: ['https://x/1.png'], resolution: '2K' },
    'p'
  );
  assert.deepEqual(input.image_input, ['https://x/1.png']);
  assert.equal(input.output_format, 'png');
});
