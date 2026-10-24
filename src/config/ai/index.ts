/**
 * 模型目录和工具配置的公共函数。前后端共用，所以只能是纯函数：
 * 前端用它显示表单和价格，服务端用它校验输入、算价、拼供应商参数
 */
import { getModel, MODELS, USD_PER_CREDIT } from './models';
import { getTool, TOOLS } from './tools';
import type {
  FieldKey,
  FieldSpec,
  FieldValue,
  GenValues,
  ModelDef,
  ToolDef,
} from './types';

export * from './types';
export { MODELS, TOOLS, USD_PER_CREDIT, getModel, getTool };

/** 用户能在界面上调的字段（顺序就是表单顺序） */
const FIELD_ORDER: FieldKey[] = [
  'image',
  'endImage',
  'images',
  'prompt',
  'aspectRatio',
  'resolution',
  'duration',
  'audio',
];

export function toolModels(tool: ToolDef): ModelDef[] {
  return tool.models.map(getModel).filter((m): m is ModelDef => !!m);
}

/** 工具是否让用户写提示词 */
export function toolTakesPrompt(tool: ToolDef): boolean {
  return !tool.promptTemplate || tool.promptTemplate.includes('{prompt}');
}

/**
 * 这一步要用户提供的图：两步工具的照片在 pre 那一步，主模型的首帧由 pre 的结果提供
 */
function inputModel(tool: ToolDef, model: ModelDef): ModelDef {
  return (tool.pre && getModel(tool.pre.model)) || model;
}

/** 当前工具 + 模型要在表单上显示的字段 */
export function visibleFields(tool: ToolDef, model: ModelDef): FieldKey[] {
  const hidden = new Set(tool.hidden ?? []);
  const imgModel = inputModel(tool, model);
  return FIELD_ORDER.filter((k) => {
    if (hidden.has(k)) return false;
    if (k === 'prompt') return toolTakesPrompt(tool) && !!model.fields.prompt;
    if (k === 'image' || k === 'images' || k === 'endImage')
      return !!imgModel.fields[k] && !(tool.pre && k !== 'image');
    if (k === 'negativePrompt') return false;
    return !!model.fields[k];
  });
}

export interface ResolveResult {
  values: GenValues;
  errors: string[];
}

function coerce(spec: FieldSpec, v: unknown): FieldValue | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (spec.options) {
    const hit = spec.options.find((o) => String(o) === String(v));
    return hit === undefined ? undefined : hit;
  }
  if (typeof spec.default === 'boolean') return v === true || v === 'true';
  if (Array.isArray(v)) return v.map(String).slice(0, spec.max ?? 4);
  return typeof v === 'number' ? v : String(v).slice(0, 2000);
}

/**
 * 把用户提交的原始值整理成干净的统一字段：不在可选值里的丢掉、补默认值、检查必填。
 * 工具隐藏的字段一律用工具 defaults，不接受用户传值
 */
export function resolveValues(
  tool: ToolDef,
  model: ModelDef,
  raw: Record<string, unknown>
): ResolveResult {
  const values: GenValues = {};
  const errors: string[] = [];
  const shown = new Set(visibleFields(tool, model));
  const imgModel = inputModel(tool, model);

  for (const key of Object.keys(model.fields) as FieldKey[]) {
    const spec =
      (key === 'image' ? imgModel.fields.image : undefined) ??
      model.fields[key]!;
    const userValue = shown.has(key) ? coerce(spec, raw[key]) : undefined;
    const v =
      userValue ??
      (tool.defaults?.[key] as FieldValue | undefined) ??
      (spec.default as FieldValue | undefined);
    if (v !== undefined) values[key] = v;
  }
  // 两步工具：照片字段属于 pre 模型
  if (tool.pre && imgModel.fields.image && shown.has('image')) {
    const v = coerce(imgModel.fields.image, raw.image);
    if (v !== undefined) values.image = v;
  }

  if (toolTakesPrompt(tool)) {
    const p = String(raw.prompt ?? '').trim();
    if (!p && model.fields.prompt?.required && !tool.promptTemplate)
      errors.push('prompt');
    values.prompt = p;
  }
  if (shown.has('image') && imgModel.fields.image?.required && !values.image)
    errors.push('image');
  return { values, errors };
}

/** 单个模型、一次调用多少积分 */
export function modelPrice(model: ModelDef, values: GenValues): number {
  const rule = model.price;
  const tier = rule.tiers?.find(
    (t) => String(values[t.field]) === String(t.value)
  );
  const unit = tier?.credits ?? rule.credits;
  if (rule.per === 'second') {
    const secs = Number(values.duration ?? model.fields.duration?.default ?? 5);
    return Math.ceil(unit * (Number.isFinite(secs) && secs > 0 ? secs : 5));
  }
  return Math.ceil(unit);
}

/** 工具一次生成的总价（两步工具 = 两步相加） */
export function toolPrice(
  tool: ToolDef,
  model: ModelDef,
  values: GenValues
): number {
  let total = modelPrice(model, values);
  const pre = tool.pre && getModel(tool.pre.model);
  if (pre) total += modelPrice(pre, tool.pre!.defaults ?? {});
  return total;
}

export function creditsToUsd(credits: number): string {
  return (credits * USD_PER_CREDIT).toFixed(2);
}

/** 把用户提示词套进模板 */
export function fillPrompt(template: string | undefined, userPrompt: string) {
  if (!template) return userPrompt;
  return template.replace('{prompt}', userPrompt).replace(/\s+/g, ' ').trim();
}

/** 统一字段 → 供应商参数 */
export function providerInput(
  model: ModelDef,
  values: GenValues,
  prompt: string
): Record<string, unknown> {
  const input: Record<string, unknown> = { ...(model.fixed ?? {}) };
  for (const [key, spec] of Object.entries(model.fields) as [
    FieldKey,
    FieldSpec,
  ][]) {
    let v: unknown = key === 'prompt' ? prompt : values[key];
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length))
      continue;
    if (spec.array && !Array.isArray(v)) v = [v];
    if (!spec.array && Array.isArray(v)) v = v[0];
    if (spec.asString) v = String(v);
    input[spec.param] = v;
  }
  return input;
}

export function toolsOfType(type: ToolDef['type']) {
  return TOOLS.filter((t) => t.type === type);
}
