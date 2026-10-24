import type { ToolDef } from './types';

/**
 * Tools and effects for AIRapVideoFree (https://airapvideofree.com).
 *
 * Each item auto-generates a route (/tools/<id> or /effects/<id>) and sitemap entry.
 * - Main tool: ai-rap-video
 * - Viral rap effects: hotel-lobby-rap, drill-rap, cyberpunk-rap, boom-bap-rap, rap-star-clip
 * - General tools: image-to-video, text-to-video
 */
export const TOOLS: ToolDef[] = [
  // ─── 核心说唱生成主工具 ──────────────────────────────────────────────
  {
    id: 'ai-rap-video',
    type: 'tool',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v', 'hailuo-2-3-fast-i2v'],
    defaults: { duration: 5, aspectRatio: '9:16' },
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    copy: {
      en: {
        name: 'AI Rap Video Generator',
        h1: 'Turn any photo into a ',
        h1Em: 'viral rap video.',
        description:
          'Upload your selfie or photo, describe the rap flow and vibe, and watch AI make you spit fire bars with authentic hip-hop head nodding and swagger in seconds.',
        placeholder:
          'Rapper spitting aggressive bars with authentic head nodding, holding a mic, neon city street background, 9:16 vertical video',
      },
      zh: {
        name: 'AI 说唱视频生成器',
        h1: '上传自拍，一键变身',
        h1Em: '说唱巨星。',
        description:
          '上传你的正面自拍或照片，输入说唱 Flow 与风格，AI 自动为你生成节拍卡点、点头律动与地道 Swag 的爆款说唱短视频。',
        placeholder: '说唱歌手手握麦克风、激烈点头说唱，背景是霓虹街头，9:16 竖屏短视频',
      },
    },
  },

  // ─── 爆款说唱特效 ───────────────────────────────────────────────────
  {
    id: 'hotel-lobby-rap',
    type: 'effect',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v', 'hailuo-2-3-fast-i2v'],
    tag: 'hot',
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    promptTemplate:
      "Viral TikTok Colors Show studio: the person in the photo is standing in a vibrant monochromatic orange studio booth wearing an oversized designer hoodie and gold chains, aggressively nodding head and rapping into a vintage studio microphone hanging from the ceiling. Fast rhythm, head bobbing, street swagger, authentic hip-hop flow. Keep the person's exact face, facial features, hairstyle and skin tone recognizable. High definition, cinematic 9:16 vertical video.",
    hidden: ['duration', 'aspectRatio'],
    defaults: { duration: 5, aspectRatio: '9:16' },
    copy: {
      en: {
        name: 'Hotel Lobby Rap Booth',
        h1: 'Step into the viral ',
        h1Em: 'orange booth.',
        description:
          'The #1 TikTok trend: turn your selfie into the iconic Colors Show orange studio booth rap video. Aggressive head bobs, gold chains, and pure viral swagger.',
      },
      zh: {
        name: '橙色包厢说唱特效',
        h1: '一键进入 TikTok 顶流',
        h1Em: '橙色说唱包厢。',
        description:
          '复刻 Quavo & Takeoff 的《Hotel Lobby》橙色包厢风潮：上传一张照片，立刻生成金项链加身、面对悬吊麦克风疯狂点头的爆款说唱视频。',
      },
    },
  },
  {
    id: 'drill-rap',
    type: 'effect',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v', 'hailuo-2-3-fast-i2v'],
    tag: 'rising',
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    promptTemplate:
      "UK & NY Drill music video aesthetic: dark gritty London street at midnight with blue police sirens in the background, heavy fog and cold breath. The person from the photo is wearing a black technical puffer jacket and silver chain, delivering an aggressive rapid-fire rap verse directly to the camera with sharp hand gestures and intense eye contact. Keep the person's exact face, facial features and skin tone recognizable. Cinematic 9:16 vertical format, 808 bass camera shake effect.",
    hidden: ['duration', 'aspectRatio'],
    defaults: { duration: 5, aspectRatio: '9:16' },
    copy: {
      en: {
        name: 'UK Drill Diss Track',
        h1: 'Cold streets, ',
        h1Em: 'hard 808s.',
        description:
          'Transform your photo into a gritty midnight Drill rap music video. Dark technical puffer jacket, cold breath, and aggressive flow.',
      },
      zh: {
        name: 'Drill 凶狠快嘴特效',
        h1: '暗夜街头，',
        h1Em: '重低音 808 狂轰。',
        description:
          '一秒切换伦敦/纽约暗黑 Drill 风格：身着黑色冲锋衣羽绒服与银链，冷冽雾气中对着镜头倾泻暴风雨般的双押快嘴。',
      },
    },
  },
  {
    id: 'cyberpunk-rap',
    type: 'effect',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v', 'hailuo-2-3-fast-i2v'],
    tag: 'new',
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    promptTemplate:
      "Futuristic Neo-Tokyo cyberpunk underground rap battle: holographic neon signs reflecting in puddles, rain slicked pavement. The person in the photo is wearing high-tech streetwear with subtle cybernetic facial accents, spitting fast rhymes with dynamic camera zoom punches on the downbeats. Authentic rap flow, swagger, head nodding. Keep the person's exact face, facial features and skin tone recognizable. Photorealistic, 9:16 vertical video.",
    hidden: ['duration', 'aspectRatio'],
    defaults: { duration: 5, aspectRatio: '9:16' },
    copy: {
      en: {
        name: 'Cyberpunk Neon Cypher',
        h1: 'Futuristic rhymes in ',
        h1Em: 'neon rain.',
        description:
          'Step into a 2077 underground rap battle. Holographic city lights, punchy camera zooms, and cybernetic street style.',
      },
      zh: {
        name: '赛博朋克地下说唱',
        h1: '霓虹雨夜，',
        h1Em: '决战未来赛博。',
        description:
          '置身 2077 新东京地下 Cypher 现场：全息灯光、积水倒影、随鼓点重击的镜头缩放动效，未来感拉满。',
      },
    },
  },
  {
    id: 'boom-bap-rap',
    type: 'effect',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v', 'hailuo-2-3-fast-i2v'],
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    promptTemplate:
      "Golden Era 90s East Coast hip-hop music video: Brooklyn brownstone brick wall background with graffiti art. The person in the photo is holding a classic Shure microphone, nodding head to the boom-bap rhythm and performing an old-school rap bar with classic 90s swagger. 35mm vintage film grain texture, natural warm lighting, recognizable face from the photo. 9:16 vertical video.",
    hidden: ['duration', 'aspectRatio'],
    defaults: { duration: 5, aspectRatio: '9:16' },
    copy: {
      en: {
        name: '90s Boom-Bap Classic',
        h1: 'Golden Era 90s ',
        h1Em: 'vintage flow.',
        description:
          'Old-school Brooklyn brownstones, graffiti walls, Shure mic in hand, and classic 35mm film grain nostalgia.',
      },
      zh: {
        name: '90年代黄金时代经典',
        h1: '布鲁克林砖墙，',
        h1Em: '重温纯正 Boom-Bap。',
        description:
          '回到 90 年代黄金说唱纪元：红砖涂鸦背景、手握经典复古麦克风，浓郁的 35mm 胶片质感与经典纯粹律动。',
      },
    },
  },
  {
    id: 'rap-star-clip',
    type: 'effect',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v'],
    tag: 'new',
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    pre: {
      model: 'nano-banana-2-edit',
      promptTemplate:
        "Turn the person in this photo into a stylized cartoon street rapper wearing diamond cuban link chains, sunglasses and a streetwear hoodie. Keep the person's face shape, hairstyle and skin tone recognizable. Hip-hop album cover art style, graffiti street background. No text, no watermark.",
      defaults: { aspectRatio: '9:16', resolution: '1K' },
    },
    promptTemplate:
      'The cartoon street rapper enthusiastically spits rap bars to the camera, nodding their head up and down to the hip-hop beat, subtle camera zoom, confident street swagger.',
    hidden: ['duration', 'aspectRatio'],
    defaults: { duration: 5, aspectRatio: '9:16' },
    copy: {
      en: {
        name: 'Cartoon Rap Star',
        h1: 'Star in your own ',
        h1Em: 'cartoon rap video.',
        description:
          'Two steps in one click: your photo becomes an illustrated hip-hop avatar, then performs a dynamic rap video.',
      },
      zh: {
        name: '卡通说唱巨星',
        h1: '化身潮流',
        h1Em: '卡通说唱主角。',
        description:
          '两步一键搞定：先把自拍照变成潮牌卡通 Rapper 头像，再自动生成节拍说唱动感视频。',
      },
    },
  },

  // ─── 通用工具（用于内页 SEO 与高级自由创作）────────────────────────
  {
    id: 'image-to-video',
    type: 'tool',
    task: 'image-to-video',
    models: ['kling-2-5-turbo-i2v', 'hailuo-2-3-fast-i2v'],
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    copy: {
      en: {
        name: 'Image to Video',
        h1: 'Bring any photo ',
        h1Em: 'to life.',
        description:
          'Upload one photo and write what should move. Pick 5 or 10 seconds, wide or vertical format.',
        placeholder:
          'The rapper smiles, gestures rhythmically, and points at the camera',
      },
      zh: {
        name: '图生视频',
        h1: '一张照片，',
        h1Em: '动起来。',
        description:
          '上传一张照片，写一句希望怎么动。可以选 5 秒或 10 秒，横屏或竖屏。',
        placeholder: '说唱歌手露出自信微笑，配合节奏打手势，指向镜头',
      },
    },
  },
  {
    id: 'text-to-video',
    type: 'tool',
    task: 'text-to-video',
    models: ['kling-2-5-turbo-t2v', 'veo-3-1-fast-t2v'],
    preview: { image: '/samples/mock-image.png', video: '/samples/rap-demo.mp4' },
    copy: {
      en: {
        name: 'Text to Video',
        h1: 'Describe a scene, ',
        h1Em: 'get a clip.',
        description:
          'Write a scene prompt and let Kling, Seedance or Veo create a cinematic music video clip from scratch.',
        placeholder:
          'Cinematic slow motion shot of a hip-hop concert crowd with smoke and stage lights, 4K',
      },
      zh: {
        name: '文生视频',
        h1: '写一段分镜，',
        h1Em: '生成现场。',
        description:
          '输入文字描述，让 Kling、Seedance 或 Veo 从零生成电影级说唱演出镜头。',
        placeholder: '电影级慢镜头：烟雾弥漫的嘻哈现场，聚光灯扫过欢呼的人群，4K',
      },
    },
  },
];

export function getTool(id: string | undefined) {
  return TOOLS.find((t) => t.id === id);
}
