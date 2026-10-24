import type { ModelDef } from './types';

/**
 * 模型目录：站点用得到的模型才放进来。
 * 参数名和可选值来自 https://www.hiapi.ai/docs/models.json（2026-10-22 查），
 * 新增模型可以用 `pnpm ai:model <HiAPI 模型名>` 生成一条草稿再改。
 *
 * 价格单位是本站积分，1 积分 = USD_PER_CREDIT 美元。下面的数是按 HiAPI 报价加价估的，
 * 上线前用真实账单核对一遍（后台 → AI 任务能看到每次生成的模型和积分）
 */
export const USD_PER_CREDIT = 0.01;

export const MODELS: ModelDef[] = [
  // ─── 图片 ─────────────────────────────────────────────────────────
  {
    id: 'nano-banana-2',
    provider: 'hiapi',
    providerModel: 'Nano-Banana-2',
    label: 'Nano Banana 2',
    vendor: 'Google',
    kind: 'image',
    task: 'text-to-image',
    fields: {
      prompt: { param: 'prompt', required: true },
      images: { param: 'image_input', array: true, max: 4 },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['auto', '1:1', '3:4', '4:3', '9:16', '16:9'],
        default: 'auto',
      },
      resolution: {
        param: 'resolution',
        options: ['1K', '2K', '4K'],
        default: '1K',
      },
    },
    fixed: { output_format: 'png' },
    price: {
      per: 'image',
      credits: 12,
      tiers: [
        { field: 'resolution', value: '2K', credits: 18 },
        { field: 'resolution', value: '4K', credits: 30 },
      ],
    },
    summary: {
      en: "Google's balanced image model: strong at keeping faces and details when you add reference photos.",
      zh: 'Google 的均衡型图片模型，带参考图时人脸和细节保持得好。',
    },
  },
  {
    id: 'nano-banana-2-edit',
    provider: 'hiapi',
    providerModel: 'Nano-Banana-2',
    label: 'Nano Banana 2',
    vendor: 'Google',
    kind: 'image',
    task: 'image-edit',
    fields: {
      prompt: { param: 'prompt', required: true },
      image: { param: 'image_input', array: true, required: true },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['auto', '1:1', '3:4', '4:3', '9:16', '16:9'],
        default: 'auto',
      },
      resolution: {
        param: 'resolution',
        options: ['1K', '2K', '4K'],
        default: '1K',
      },
    },
    fixed: { output_format: 'png' },
    price: {
      per: 'image',
      credits: 12,
      tiers: [
        { field: 'resolution', value: '2K', credits: 18 },
        { field: 'resolution', value: '4K', credits: 30 },
      ],
    },
    summary: {
      en: 'Edit a photo with one sentence: change the style, scene or outfit and keep the person recognizable.',
      zh: '一句话改图：换风格、换场景、换衣服，人还是那个人。',
    },
  },
  {
    id: 'gpt-image-2',
    provider: 'hiapi',
    providerModel: 'gpt-image-2/text-to-image',
    label: 'GPT Image 2',
    vendor: 'OpenAI',
    kind: 'image',
    task: 'text-to-image',
    fields: {
      prompt: { param: 'prompt', required: true },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['auto', '1:1', '2:3', '3:2', '9:16', '16:9'],
        default: 'auto',
      },
      resolution: {
        param: 'resolution',
        options: ['1K', '2K', '4K'],
        default: '1K',
      },
    },
    price: {
      per: 'image',
      credits: 8,
      tiers: [
        { field: 'resolution', value: '2K', credits: 14 },
        { field: 'resolution', value: '4K', credits: 24 },
      ],
    },
    summary: {
      en: "OpenAI's image model: follows long prompts closely and renders text inside images well.",
      zh: 'OpenAI 的图片模型，长提示词听得懂，图里的文字也写得准。',
    },
  },

  // ─── 视频 ─────────────────────────────────────────────────────────
  {
    id: 'kling-2-5-turbo-i2v',
    provider: 'hiapi',
    providerModel: 'kling-2.5-turbo/image-to-video',
    label: 'Kling 2.5 Turbo',
    vendor: 'Kuaishou',
    kind: 'video',
    task: 'image-to-video',
    fields: {
      prompt: { param: 'prompt', required: true },
      image: { param: 'image_urls', array: true, required: true },
      duration: { param: 'duration', options: [5, 10], default: 5 },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['16:9', '9:16', '1:1'],
        default: '16:9',
      },
      negativePrompt: { param: 'negative_prompt' },
    },
    price: { per: 'second', credits: 7 },
    fallback: 'hailuo-2-3-fast-i2v',
    summary: {
      en: 'Stable, natural motion from a single photo. A safe default for image-to-video.',
      zh: '一张照片动起来，动作自然、稳定，图生视频的稳妥默认。',
    },
  },
  {
    id: 'hailuo-2-3-fast-i2v',
    provider: 'hiapi',
    providerModel: 'hailuo-2.3-fast/image-to-video',
    label: 'Hailuo 2.3 Fast',
    vendor: 'MiniMax',
    kind: 'video',
    task: 'image-to-video',
    fields: {
      prompt: { param: 'prompt', required: true },
      image: { param: 'image_url', required: true },
      duration: {
        param: 'duration',
        options: [6, 10],
        default: 6,
        asString: true,
      },
    },
    fixed: { prompt_optimizer: false },
    price: { per: 'second', credits: 6 },
    summary: {
      en: 'Fast and affordable image-to-video with lively motion.',
      zh: '出片快、便宜，动作活泼的图生视频。',
    },
    badges: ['fast'],
  },
  {
    id: 'seedance-2-0-mini',
    provider: 'hiapi',
    providerModel: 'seedance-2.0-mini',
    label: 'Seedance 2.0 Mini',
    vendor: 'ByteDance',
    kind: 'video',
    task: 'image-to-video',
    fields: {
      prompt: { param: 'prompt', required: true },
      image: { param: 'first_frame_url', required: true },
      endImage: { param: 'last_frame_url' },
      resolution: {
        param: 'resolution',
        options: ['480p', '720p'],
        default: '720p',
      },
      duration: { param: 'duration', options: [5, 10], default: 5 },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['adaptive', '16:9', '9:16', '1:1'],
        default: 'adaptive',
      },
      audio: { param: 'generate_audio', default: false },
    },
    price: {
      per: 'second',
      credits: 8,
      tiers: [{ field: 'resolution', value: '480p', credits: 4 }],
    },
    summary: {
      en: 'Cost-efficient clips with optional first and last frame and native audio.',
      zh: '性价比高，可以同时定首帧和尾帧，还能带原生音频。',
    },
    badges: ['audio', 'end-frame'],
  },
  {
    id: 'kling-2-5-turbo-t2v',
    provider: 'hiapi',
    providerModel: 'kling-2.5-turbo/text-to-video',
    label: 'Kling 2.5 Turbo',
    vendor: 'Kuaishou',
    kind: 'video',
    task: 'text-to-video',
    fields: {
      prompt: { param: 'prompt', required: true },
      duration: { param: 'duration', options: [5, 10], default: 5 },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['16:9', '9:16', '1:1'],
        default: '16:9',
      },
      negativePrompt: { param: 'negative_prompt' },
    },
    price: { per: 'second', credits: 7 },
    summary: {
      en: 'Turn a sentence into a cinematic 5 or 10 second clip.',
      zh: '一句话生成 5 秒或 10 秒的电影感短片。',
    },
  },
  {
    id: 'veo-3-1-fast-t2v',
    provider: 'hiapi',
    providerModel: 'veo-3.1-fast/text-to-video',
    label: 'Veo 3.1 Fast',
    vendor: 'Google',
    kind: 'video',
    task: 'text-to-video',
    fields: {
      prompt: { param: 'prompt', required: true },
      duration: { param: 'duration', options: [4, 6, 8], default: 8 },
      resolution: {
        param: 'resolution',
        options: ['720p', '1080p'],
        default: '720p',
      },
      aspectRatio: {
        param: 'aspect_ratio',
        options: ['16:9', '9:16'],
        default: '16:9',
      },
      audio: { param: 'generate_audio', default: true },
    },
    price: {
      per: 'second',
      credits: 30,
      tiers: [{ field: 'resolution', value: '1080p', credits: 36 }],
    },
    summary: {
      en: "Google's video model with native sound: dialogue, music and effects in one pass.",
      zh: 'Google 的视频模型，对白、音乐、音效一次生成。',
    },
    badges: ['audio', 'hd'],
  },
];

export function getModel(id: string | undefined): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}
