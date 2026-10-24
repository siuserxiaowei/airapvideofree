/**
 * 通用生成引擎：任何工具（文生图、改图、图生视频、文生视频、特效、两步工具）都走这里。
 * 放在 ai-tasks 里，因为扣积分和退积分要经过 ai_task 行（模块间唯一允许的积分依赖）。
 *
 *   start   → 校验输入 → 服务端算价 → 扣积分 + 建 ai_task → 提交第 1 步
 *   advance → 轮询当前步；成功则提交下一步（上一步的结果当首帧），全部完成后存结果；
 *             失败先换 fallback 模型重试一次，还失败就退积分
 *
 * 状态存在 ai_task.options（JSON）；ai_task.taskInfo 里是退款用的 creditId，不能覆盖
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { HiapiProvider, type HiapiTaskResult } from '@/core/ai/hiapi';
import { db } from '@/core/db';
import { R2Provider } from '@/core/storage';
import {
  fillPrompt,
  getModel,
  getTool,
  providerInput,
  resolveValues,
  toolPrice,
  type GenValues,
  type MediaKind,
  type ModelDef,
} from '@/config/ai';
import { aiTask } from '@/config/db/schema';

import { AITaskStatus, createTask, updateTask } from './service';

/** ai_task.scene 上的标记，用来只查本引擎建的任务 */
export const GEN_SCENE_TAG = 'gen';
/** 超过这么久还没完成就判失败并退积分 */
const MAX_AGE_MS = 25 * 60 * 1000;
/** 本地开发时上传的图存在 public/uploads/<md5>.<ext> */
const LOCAL_UPLOAD_RE = /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/;
const IMAGE_FIELDS = ['image', 'images', 'endImage'] as const;

interface Step {
  modelId: string;
  prompt: string;
  values: GenValues;
  providerTaskId?: string;
  /** 供应商给的结果链接（公网可访问，喂给下一步） */
  sourceUrl?: string;
  fallbackUsed?: boolean;
}

export interface GenState {
  v: 2;
  toolId: string;
  modelId: string;
  /** 用户自己写的提示词（历史记录和「再做一个」用） */
  userPrompt: string;
  steps: Step[];
  step: number;
  outputs: { url: string; kind: MediaKind }[];
  error?: string;
}

/** 返回给浏览器的任务，不含供应商任务号和完整提示词 */
export interface GenPublicTask {
  id: string;
  status: string;
  toolId: string;
  modelId: string;
  kind: MediaKind;
  step: number;
  stepCount: number;
  prompt: string;
  outputs: { url: string; kind: MediaKind }[];
  costCredits: number;
  error?: string;
  createdAt: Date;
}

type Configs = Record<string, string | undefined>;

// ─── 供应商（真实或模拟）────────────────────────────────────────────

interface TaskRunner {
  create(
    model: ModelDef,
    input: Record<string, unknown>,
    key: string
  ): Promise<string>;
  get(taskId: string): Promise<HiapiTaskResult>;
}

function isMock(configs: Configs) {
  const v = configs.generator_mock;
  // 正式构建里无论怎么设都不生效
  return (v === '1' || v === 'fail') && Boolean(import.meta.env?.DEV);
}

/**
 * 本地测试用：每个任务 6 秒后「完成」。图片返回上传的原图或示例图，视频返回示例视频。
 * 任务号里带着模拟需要的数据
 */
let mockFailAll = false;
const mockRunner: TaskRunner = {
  async create(model, input) {
    const firstImage = Object.values(input).find(
      (v) =>
        (typeof v === 'string' && /^(\/uploads\/|https?:)/.test(v)) ||
        (Array.isArray(v) && typeof v[0] === 'string')
    );
    const src = Array.isArray(firstImage) ? firstImage[0] : firstImage;
    const fail =
      mockFailAll || String(input.prompt || '').includes('MOCK_FAIL');
    return `mock:${model.kind}:${Date.now()}:${fail ? 1 : 0}:${Buffer.from(String(src || '')).toString('base64url')}`;
  },
  async get(taskId) {
    const [, kind, ts, fail, src] = taskId.split(':');
    if (Date.now() - Number(ts) < 6000)
      return { state: 'pending', status: 'handling', urls: [] };
    if (fail === '1')
      return { state: 'fail', status: 'fail', urls: [], error: 'Mock failure' };
    const photo = Buffer.from(src || '', 'base64url').toString();
    const url =
      kind === 'image'
        ? photo && !photo.startsWith('data:')
          ? photo
          : '/samples/mock-image.png'
        : '/samples/mock-video.mp4';
    return { state: 'success', status: 'success', urls: [url] };
  },
};

function getRunner(configs: Configs): TaskRunner {
  if (isMock(configs)) {
    // GENERATOR_MOCK=fail 让所有模拟任务失败，用来测退积分
    mockFailAll = configs.generator_mock === 'fail';
    return mockRunner;
  }
  const apiKey = configs.hiapi_api_key;
  if (!apiKey)
    throw new Error('Generator is not configured yet (missing HiAPI key)');
  const hiapi = new HiapiProvider({ apiKey });
  return {
    create: (model, input, key) =>
      hiapi.createTask({
        model: model.providerModel,
        input,
        idempotencyKey: key,
      }),
    get: (taskId) => hiapi.getTask(taskId),
  };
}

// ─── 工具函数 ───────────────────────────────────────────────────────

function parseState(raw: unknown): GenState | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const s = JSON.parse(raw);
    return s && s.v === 2 ? (s as GenState) : null;
  } catch {
    return null;
  }
}

function toPublic(row: typeof aiTask.$inferSelect): GenPublicTask {
  const s = parseState(row.options);
  const model = getModel(s?.modelId);
  return {
    id: row.id,
    status: row.status,
    toolId: s?.toolId ?? '',
    modelId: s?.modelId ?? '',
    kind: model?.kind ?? 'image',
    step: s?.step ?? 0,
    stepCount: s?.steps.length ?? 1,
    prompt: s?.userPrompt ?? '',
    outputs: s?.outputs ?? [],
    costCredits: row.costCredits,
    error:
      row.status === AITaskStatus.FAILED
        ? s?.error || 'Generation failed'
        : undefined,
    createdAt: row.createdAt,
  };
}

async function saveState(id: string, state: GenState, providerTaskId?: string) {
  await db()
    .update(aiTask)
    .set({
      options: JSON.stringify(state),
      ...(providerTaskId ? { taskId: providerTaskId } : {}),
    })
    .where(eq(aiTask.id, id));
}

/**
 * 是不是本站自己上传的图。只有这些能发给模型，浏览器不能让我们花钱处理任意链接
 */
export function isOwnUpload(url: string, configs: Configs): boolean {
  if (LOCAL_UPLOAD_RE.test(url)) return true;
  const domain = (configs.r2_domain || '').replace(/\/+$/, '');
  return Boolean(domain) && url.startsWith(`${domain}/`) && !url.includes('..');
}

/** HiAPI 要公网链接；本地开发上传的图改成内联 data URI 发过去 */
async function resolveInputImage(url: string): Promise<string> {
  if (!LOCAL_UPLOAD_RE.test(url)) return url;
  const file = path.join(process.cwd(), 'public', url);
  const body = await readFile(file);
  const ext = path.extname(file).slice(1);
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${body.toString('base64')}`;
}

async function resolveImages(
  values: GenValues,
  mock: boolean
): Promise<GenValues> {
  if (mock) return values; // 模拟模式直接用原链接，结果里能看到原图
  const out: GenValues = { ...values };
  for (const k of IMAGE_FIELDS) {
    const v = out[k];
    if (typeof v === 'string') out[k] = await resolveInputImage(v);
    else if (Array.isArray(v))
      out[k] = await Promise.all(v.map(resolveInputImage));
  }
  return out;
}

/** R2 配好了就把结果转存到自己的存储（供应商链接会过期） */
async function persistOutput(
  url: string,
  key: string,
  contentType: string,
  configs: Configs
) {
  if (!url.startsWith('http')) return url; // 模拟 / 本地
  if (
    !(configs.r2_access_key && configs.r2_secret_key && configs.r2_bucket_name)
  )
    return url;
  const r2 = new R2Provider({
    accountId: configs.r2_account_id || '',
    accessKeyId: configs.r2_access_key,
    secretAccessKey: configs.r2_secret_key,
    bucket: configs.r2_bucket_name,
    uploadPath: configs.r2_upload_path,
    region: 'auto',
    endpoint: configs.r2_endpoint,
    publicDomain: configs.r2_domain,
  });
  const res = await r2.downloadAndUpload({
    url,
    key,
    contentType,
    disposition: 'inline',
  });
  return res.success && res.url ? res.url : url;
}

async function fail(id: string, state: GenState, message: string) {
  await saveState(id, { ...state, error: message.slice(0, 200) });
  // updateTask 按 taskInfo 里记的 creditId 退积分（退款本身是幂等的）
  await updateTask({ taskId: id, status: AITaskStatus.FAILED });
}

async function submitStep(
  runner: TaskRunner,
  taskId: string,
  state: GenState,
  modelId: string,
  suffix: string
) {
  const step = state.steps[state.step];
  const model = getModel(modelId)!;
  const values = await resolveImages(step.values, runner === mockRunner);
  const input = providerInput(model, values, step.prompt);
  step.providerTaskId = await runner.create(
    model,
    input,
    `${taskId}-${state.step}${suffix}`
  );
  await saveState(taskId, state, step.providerTaskId);
}

// ─── 对外接口 ───────────────────────────────────────────────────────

export async function startGeneration(params: {
  userId: string;
  toolId: string;
  modelId?: string;
  input: Record<string, unknown>;
  configs: Configs;
}): Promise<GenPublicTask> {
  const { userId, configs } = params;
  const tool = getTool(params.toolId);
  if (!tool) throw new Error('Unknown tool');
  const modelId =
    params.modelId && tool.models.includes(params.modelId)
      ? params.modelId
      : tool.models[0];
  const model = getModel(modelId);
  if (!model) throw new Error('Unknown model');

  const { values, errors } = resolveValues(tool, model, params.input);
  if (errors.includes('image')) throw new Error('Please upload a photo first');
  if (errors.includes('prompt'))
    throw new Error('Please describe what you want');
  for (const k of IMAGE_FIELDS) {
    const v = values[k];
    const urls = typeof v === 'string' ? [v] : Array.isArray(v) ? v : [];
    if (
      urls.some(
        (u) => !/\.(jpe?g|png|webp)$/i.test(u) || !isOwnUpload(u, configs)
      )
    )
      throw new Error('Please upload your photo first');
  }

  const runner = getRunner(configs); // 没配 key 时在扣费前就报错
  const userPrompt = String(values.prompt ?? '');
  const steps: Step[] = [];
  const pre = tool.pre && getModel(tool.pre.model);
  if (tool.pre && pre) {
    steps.push({
      modelId: pre.id,
      prompt: fillPrompt(tool.pre.promptTemplate, userPrompt),
      values: { ...tool.pre.defaults, image: values.image },
    });
    const { image: _photo, ...rest } = values;
    steps.push({
      modelId: model.id,
      prompt: fillPrompt(tool.promptTemplate, userPrompt),
      values: rest,
    });
  } else {
    steps.push({
      modelId: model.id,
      prompt: fillPrompt(tool.promptTemplate, userPrompt),
      values,
    });
  }

  // 积分和任务行在同一个原子操作里写入；积分不够会抛 'Insufficient credits'
  const task = await createTask({
    userId,
    mediaType: model.kind,
    provider: runner === mockRunner ? 'mock' : model.provider,
    model: model.providerModel,
    prompt: steps[steps.length - 1].prompt,
    costCredits: toolPrice(tool, model, values),
  });
  await db()
    .update(aiTask)
    .set({ scene: GEN_SCENE_TAG })
    .where(eq(aiTask.id, task.id));

  const state: GenState = {
    v: 2,
    toolId: tool.id,
    modelId: model.id,
    userPrompt,
    steps,
    step: 0,
    outputs: [],
  };
  try {
    await submitStep(runner, task.id, state, steps[0].modelId, '');
    await updateTask({ taskId: task.id, status: AITaskStatus.PROCESSING });
  } catch (e: any) {
    await fail(task.id, state, e?.message || 'Could not start generation');
  }
  return (await getGeneration({ userId, id: task.id }))!;
}

/** 轮询一次供应商，推进流程。重复调用是安全的 */
export async function advanceGeneration(params: {
  userId: string;
  id: string;
  configs: Configs;
}): Promise<GenPublicTask | null> {
  const row = await getRow(params.userId, params.id);
  if (!row) return null;
  if (
    row.status !== AITaskStatus.PENDING &&
    row.status !== AITaskStatus.PROCESSING
  )
    return toPublic(row);
  const state = parseState(row.options);
  if (!state) return toPublic(row);

  if (Date.now() - new Date(row.createdAt).getTime() > MAX_AGE_MS) {
    await fail(row.id, state, 'Generation timed out');
    return getGeneration(params);
  }

  const runner =
    row.provider === 'mock' ? mockRunner : getRunner(params.configs);
  const step = state.steps[state.step];
  if (!step?.providerTaskId) return toPublic(row);

  try {
    const r = await runner.get(step.providerTaskId);
    if (r.state === 'pending') return toPublic(row);

    if (r.state === 'fail' || !r.urls[0]) {
      // 主模型偶尔拒图：换 fallback 模型重试一次再退款
      const fb = getModel(getModel(step.modelId)?.fallback);
      if (fb && !step.fallbackUsed) {
        step.fallbackUsed = true;
        step.modelId = fb.id;
        await submitStep(runner, row.id, state, fb.id, '-fallback');
        return getGeneration(params);
      }
      await fail(row.id, state, r.error || 'Generation failed');
      return getGeneration(params);
    }

    step.sourceUrl = r.urls[0];
    const next = state.steps[state.step + 1];
    if (next) {
      // 上一步的结果（供应商的公网链接）当下一步的首帧
      next.values = { ...next.values, image: r.urls[0] };
      state.step += 1;
      await submitStep(runner, row.id, state, next.modelId, '');
      return getGeneration(params);
    }

    const kind = getModel(step.modelId)?.kind ?? 'image';
    const ext = kind === 'video' ? 'mp4' : 'png';
    state.outputs = await Promise.all(
      r.urls.slice(0, 4).map(async (u, i) => ({
        kind,
        url: await persistOutput(
          u,
          `generations/${row.id}${i ? `-${i}` : ''}.${ext}`,
          kind === 'video' ? 'video/mp4' : 'image/png',
          params.configs
        ),
      }))
    );
    await saveState(row.id, state);
    await updateTask({ taskId: row.id, status: AITaskStatus.SUCCESS });
    return getGeneration(params);
  } catch (e: any) {
    // 网络抖动：任务保持进行中，下次轮询再试
    console.error('generation advance error:', e?.message);
  }
  return toPublic(row);
}

async function getRow(userId: string, id: string) {
  const [row] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, id),
        eq(aiTask.userId, userId),
        eq(aiTask.scene, GEN_SCENE_TAG),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getGeneration(params: {
  userId: string;
  id: string;
}): Promise<GenPublicTask | null> {
  const row = await getRow(params.userId, params.id);
  return row ? toPublic(row) : null;
}

export async function listGenerations(userId: string, limit = 24) {
  const rows = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.scene, GEN_SCENE_TAG),
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(limit);
  return rows.map(toPublic);
}
