/**
 * AI 生成的数据模型：模型目录（models.ts）+ 工具配置（tools.ts）。
 * 前后端共用（不能 import 服务端代码）；价格在这里算，服务端用同一套函数重新算，以服务端为准
 */

export type MediaKind = 'image' | 'video';

/** 用户看到的任务类型 */
export type GenTask =
  | 'text-to-image'
  | 'image-edit'
  | 'text-to-video'
  | 'image-to-video';

/**
 * 统一字段：工作台只认这些名字，每个模型在 fields 里写清楚对应的供应商参数名。
 * 加新模型不用改界面和引擎
 */
export type FieldKey =
  | 'prompt'
  | 'negativePrompt'
  | 'image' // 首帧或要编辑的图
  | 'images' // 多张参考图
  | 'endImage' // 尾帧
  | 'aspectRatio'
  | 'resolution'
  | 'duration'
  | 'audio'
  | 'flow_vibe';

export interface ToolOptionChoice {
  value: string;
  label: { en: string; zh: string };
  prompt?: string;
}

export interface ToolOptionDef {
  key: string;
  label: { en: string; zh: string };
  default: string;
  choices: ToolOptionChoice[];
}

export type FieldValue = string | number | boolean | string[];
export type GenValues = Partial<Record<FieldKey, FieldValue>>;

export interface FieldSpec {
  /** 供应商的参数名，如 image_urls、first_frame_url */
  param: string;
  required?: boolean;
  /** 可选值（第一个不一定是默认值，默认值见 default） */
  options?: (string | number)[];
  default?: string | number | boolean;
  /** 供应商要数组时为 true：单张图也会包成 [url] */
  array?: boolean;
  /** 多图时最多几张 */
  max?: number;
  /** 发给供应商时转成字符串（如海螺的 duration: '6'） */
  asString?: boolean;
}

export interface PriceRule {
  /** 计价单位：每张图、每秒视频、每次请求 */
  per: 'image' | 'second' | 'request';
  /** 每单位多少积分（没命中分档时用） */
  credits: number;
  /** 按某个字段的取值分档，如 resolution=1080p 每秒 20 积分 */
  tiers?: { field: FieldKey; value: string | number; credits: number }[];
}

export interface ModelDef {
  /** 站内 id，也是 /models/<id> 的网址 */
  id: string;
  provider: 'hiapi';
  /** 供应商的模型名，见 https://www.hiapi.ai/docs/models.json */
  providerModel: string;
  label: string;
  vendor: string;
  kind: MediaKind;
  task: GenTask;
  fields: Partial<Record<FieldKey, FieldSpec>>;
  /** 每次都固定发送的参数 */
  fixed?: Record<string, unknown>;
  price: PriceRule;
  /** 主模型失败时自动换这个模型重试一次（同 task、同 kind） */
  fallback?: string;
  /** 一句话介绍，模型页和选择器里显示 */
  summary: { en: string; zh: string };
  badges?: ('audio' | 'fast' | 'hd' | 'end-frame')[];
}

export interface ToolCopy {
  /** 卡片和导航上的短名 */
  name: string;
  /** 页面 h1：正文 + 强调词 */
  h1: string;
  h1Em: string;
  /** meta description，也是页面首段 */
  description: string;
  /** 输入框占位提示 */
  placeholder?: string;
  faq?: { q: string; a: string }[];
}

export interface ToolDef {
  /** 也是 /tools/<id> 或 /effects/<id> 的网址 */
  id: string;
  /** tool：通用工具，用户写提示词；effect：一键特效，提示词固定，用户只传照片 */
  type: 'tool' | 'effect';
  task: GenTask;
  /** 可选模型，第一个是默认 */
  models: string[];
  /**
   * 提示词模板。含 {prompt} 时用户能写提示词，会被替换进去；
   * 不含 {prompt} 时提示词框隐藏，整段固定（特效就是这样）
   */
  promptTemplate?: string;
  /** 不给用户看的字段（用 defaults 里的值） */
  hidden?: FieldKey[];
  /** 覆盖模型默认值 */
  defaults?: GenValues;
  /**
   * 两步工具：先用 pre 把照片做成一张风格图，再把它作为首帧交给主模型做视频。
   * 价格 = 两步相加
   */
  pre?: { model: string; promptTemplate: string; defaults?: GenValues };
  /** 卡片预览（public/ 下的路径或 R2 链接），没有就显示色块 */
  preview?: { image?: string; video?: string };
  tag?: 'hot' | 'new' | 'rising';
  /** 工具专有可选配置项（如说唱运镜与律动风格选择） */
  options?: ToolOptionDef[];
  copy: { en: ToolCopy; zh: ToolCopy };
}
