import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import {
  creditsToUsd,
  getModel,
  getTool,
  resolveValues,
  toolModels,
  toolPrice,
  toolTakesPrompt,
  visibleFields,
  type FieldKey,
  type GenTask,
  type MediaKind,
  type ToolDef,
} from '@/config/ai';
import { apiGet, apiPost } from '@/lib/api-client';
import { track } from '@/lib/track';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import {
  ImageUploader,
  type ImageUploaderValue,
} from '@/components/image-uploader';
import { Button, buttonVariants } from '@/components/ui/button';

type Task = {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | string;
  toolId: string;
  modelId: string;
  kind: MediaKind;
  step: number;
  stepCount: number;
  prompt: string;
  outputs: { url: string; kind: MediaKind }[];
  costCredits: number;
  error?: string;
  createdAt: string;
};

const ACTIVE_KEY = 'studio.activeTask';
const isRunning = (t?: Task | null) =>
  !!t && (t.status === 'pending' || t.status === 'processing');

function readActive(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
function writeActive(id: string | null) {
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // 存储被禁用：刷新后不能恢复进行中的任务而已
  }
}

/** 页面上任意位置可以让工作台切到某个工具并填好提示词（作品墙「做同款」用） */
export function prefillStudio(detail: { toolId: string; prompt?: string }) {
  window.dispatchEvent(new CustomEvent('studio:prefill', { detail }));
  document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
}

function copyOf(tool: ToolDef) {
  return getLocale() === 'zh' ? tool.copy.zh : tool.copy.en;
}

function photoLabel(task: GenTask, isEffect: boolean) {
  if (isEffect) return m['studio.photo_effect']();
  if (task === 'image-edit') return m['studio.photo_edit']();
  return m['studio.photo_first']();
}

/** 选项胶囊：画幅、清晰度、时长 */
function Chips({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: (string | number)[];
  value: unknown;
  onChange: (v: string | number) => void;
  format?: (v: string | number) => string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={String(value) === String(o)}
            onClick={() => onChange(o)}
            className="pill"
          >
            {format ? format(o) : String(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Studio({
  toolIds,
  initialToolId,
  initialModelId,
}: {
  /** 可切换的工具；只有一个时不显示切换按钮 */
  toolIds: string[];
  initialToolId?: string;
  /** 模型页用：默认选中这个模型 */
  initialModelId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionLoading } = useSession();
  const signedIn = !!session?.user;

  const tools = toolIds.map(getTool).filter((t): t is ToolDef => !!t);
  const [toolId, setToolId] = useState(initialToolId ?? tools[0]?.id);
  const tool = tools.find((t) => t.id === toolId) ?? tools[0];
  const models = toolModels(tool);
  const [modelId, setModelId] = useState(
    models.some((x) => x.id === initialModelId) ? initialModelId : models[0]?.id
  );
  const model = models.find((x) => x.id === modelId) ?? models[0];

  const [prompt, setPrompt] = useState('');
  const [photo, setPhoto] = useState<ImageUploaderValue | null>(null);
  const [endPhoto, setEndPhoto] = useState<ImageUploaderValue | null>(null);
  const [refs, setRefs] = useState<ImageUploaderValue[]>([]);
  const [opts, setOpts] = useState<Partial<Record<FieldKey, unknown>>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // 换工具时：模型回到默认，清掉不适用的选项
  const [firstTool] = useState(tool.id);
  useEffect(() => {
    if (tool.id === firstTool) return;
    setModelId(toolModels(tool)[0]?.id);
    setOpts({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.id]);

  useEffect(() => {
    if (signedIn) setActiveId((cur) => cur ?? readActive());
  }, [signedIn]);

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const d = (e as CustomEvent<{ toolId: string; prompt?: string }>).detail;
      if (tools.some((t) => t.id === d.toolId)) setToolId(d.toolId);
      if (d.prompt) setPrompt(d.prompt);
    };
    window.addEventListener('studio:prefill', onPrefill);
    return () => window.removeEventListener('studio:prefill', onPrefill);
  }, [tools]);

  const fields = visibleFields(tool, model);
  const rawInput = useMemo(() => {
    const raw: Record<string, unknown> = { ...opts, prompt };
    if (photo?.url) raw.image = photo.url;
    if (endPhoto?.url) raw.endImage = endPhoto.url;
    const refUrls = refs.filter((r) => r.url).map((r) => r.url!);
    if (refUrls.length) raw.images = refUrls;
    return raw;
  }, [opts, prompt, photo, endPhoto, refs]);
  const { values } = resolveValues(tool, model, rawInput);
  const cost = toolPrice(tool, model, values);

  const creditsQuery = useQuery({
    queryKey: ['credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: signedIn,
  });
  const balance = creditsQuery.data?.balance ?? 0;
  const lacksCredits = signedIn && creditsQuery.isSuccess && balance < cost;

  const recentQuery = useQuery({
    queryKey: ['ai-tasks'],
    queryFn: () => apiGet<{ items: Task[] }>('/api/ai/tasks'),
    enabled: signedIn,
  });

  const taskQuery = useQuery({
    queryKey: ['ai-task', activeId],
    queryFn: () =>
      apiGet<Task>(`/api/ai/task?id=${encodeURIComponent(activeId!)}`),
    enabled: signedIn && !!activeId,
    refetchInterval: (q) =>
      isRunning(q.state.data as Task | undefined) ? 4000 : false,
    retry: 1,
  });
  const task = taskQuery.data ?? null;

  const finishedId = task && !isRunning(task) ? task.id : null;
  useEffect(() => {
    if (!finishedId || !task) return;
    queryClient.invalidateQueries({ queryKey: ['credits'] });
    queryClient.invalidateQueries({ queryKey: ['ai-tasks'] });
    writeActive(null);
    if (task.status === 'failed')
      toast.error(task.error || m['studio.failed']());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishedId, task?.status]);

  const generate = useMutation({
    mutationFn: () =>
      apiPost<Task>('/api/ai/generate', {
        toolId: tool.id,
        modelId: model.id,
        input: rawInput,
      }),
    onSuccess: (t) => {
      setActiveId(t.id);
      writeActive(t.id);
      queryClient.setQueryData(['ai-task', t.id], t);
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['ai-tasks'] });
    },
    onError: (e: Error) => {
      if (/insufficient credits/i.test(e.message)) {
        track('paywall_hit', { feature: tool.id });
        toast.error(m['studio.no_credits']());
      } else toast.error(e.message);
    },
  });

  const needsPhoto = fields.includes('image');
  const uploading = [photo, endPhoto, ...refs].some(
    (p) => p?.status === 'uploading'
  );
  const photoReady =
    !needsPhoto || (photo?.status === 'uploaded' && !!photo.url);
  const promptReady =
    !fields.includes('prompt') || !!tool.promptTemplate || !!prompt.trim();
  const busy = generate.isPending || isRunning(task);

  function handleSubmit() {
    if (!signedIn) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + '#studio')}`
      );
      return;
    }
    if (uploading) return toast.error(m['studio.uploading']());
    if (!photoReady) return toast.error(m['studio.need_photo']());
    if (!promptReady) return toast.error(m['studio.need_prompt']());
    if (lacksCredits) {
      track('paywall_hit', { feature: tool.id });
      return;
    }
    generate.mutate();
  }

  const statusText = !task
    ? ''
    : task.status === 'failed'
      ? m['studio.failed']()
      : task.status === 'success'
        ? m['studio.done']()
        : task.stepCount > 1
          ? m['studio.status_step']({
              step: task.step + 1,
              total: task.stepCount,
            })
          : m['studio.status_running']();

  const recent = (recentQuery.data?.items ?? [])
    .filter((t) => t.status === 'success' && t.outputs[0])
    .slice(0, 6);
  const out = task?.status === 'success' ? task.outputs[0] : undefined;
  const c = copyOf(tool);
  const fmtDuration = (v: string | number) =>
    m['studio.seconds']({ n: String(v) });

  return (
    <div id="studio" className="scroll-mt-24">
      {tools.length > 1 && (
        <div
          role="tablist"
          className="mb-4 flex flex-wrap justify-center gap-2"
        >
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tool.id}
              onClick={() => setToolId(t.id)}
              className="pill"
            >
              {copyOf(t).name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-card grid overflow-hidden rounded-[var(--r3)] shadow-[inset_0_0_0_1px_var(--line),var(--shadow)] lg:grid-cols-[1.05fr_1fr]">
        {/* 输入 */}
        <div className="space-y-6 p-5 sm:p-8">
          {models.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                {m['studio.model']()}
              </p>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {models.map((x) => {
                  const selected = x.id === model.id;
                  const price = toolPrice(
                    tool,
                    x,
                    resolveValues(tool, x, rawInput).values
                  );
                  return (
                    <button
                      key={x.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setModelId(x.id)}
                      className={cn(
                        'rounded-[var(--r1)] px-4 py-3 text-left transition-[background,box-shadow,transform] duration-200 hover:-translate-y-px',
                        selected
                          ? 'bg-primary/10 shadow-[inset_0_0_0_1.5px_var(--brand)]'
                          : 'hover:bg-muted shadow-[inset_0_0_0_1px_var(--line)]'
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">{x.label}</span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {m['studio.credits_short']({ n: String(price) })}
                        </span>
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                        {getLocale() === 'zh' ? x.summary.zh : x.summary.en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {fields.includes('image') && (
            <div>
              <p className="mb-1 text-sm font-semibold">
                {photoLabel(tool.task, tool.type === 'effect')}
              </p>
              <p className="text-muted-foreground mb-3 text-sm">
                {m['studio.photo_hint']()}
              </p>
              {signedIn ? (
                <ImageUploader
                  key={`p-${tool.id}`}
                  maxSizeMB={10}
                  onChange={(i) => setPhoto(i[0] ?? null)}
                />
              ) : (
                <div className="bg-muted/60 flex flex-col items-start gap-3 rounded-[var(--r2)] p-5 shadow-[inset_0_0_0_1px_var(--line)]">
                  <p className="text-muted-foreground text-sm">
                    {m['studio.free_note']()}
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={sessionLoading}
                    className="rounded-full"
                  >
                    {m['studio.signin']()}
                  </Button>
                </div>
              )}
            </div>
          )}

          {signedIn && fields.includes('endImage') && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                {m['studio.photo_last']()}{' '}
                <span className="text-muted-foreground font-normal">
                  {m['studio.optional']()}
                </span>
              </p>
              <ImageUploader
                key={`e-${tool.id}-${model.id}`}
                maxSizeMB={10}
                onChange={(i) => setEndPhoto(i[0] ?? null)}
              />
            </div>
          )}

          {signedIn && fields.includes('images') && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                {m['studio.refs']()}{' '}
                <span className="text-muted-foreground font-normal">
                  {m['studio.optional']()}
                </span>
              </p>
              <ImageUploader
                key={`r-${tool.id}-${model.id}`}
                allowMultiple
                maxImages={model.fields.images?.max ?? 4}
                maxSizeMB={10}
                onChange={(items) => setRefs(items)}
              />
            </div>
          )}

          {fields.includes('prompt') && toolTakesPrompt(tool) && (
            <div>
              <label
                htmlFor="studio-prompt"
                className="mb-2 block text-sm font-semibold"
              >
                {m['studio.prompt']()}
              </label>
              <textarea
                id="studio-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={c.placeholder}
                rows={3}
                maxLength={2000}
                className="bg-background w-full resize-y rounded-[var(--r2)] px-4 py-3 text-base shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]"
              />
            </div>
          )}

          {(['aspectRatio', 'resolution', 'duration'] as const)
            .filter((k) => fields.includes(k) && model.fields[k]?.options)
            .map((k) => (
              <Chips
                key={k}
                label={
                  k === 'aspectRatio'
                    ? m['studio.aspect']()
                    : k === 'resolution'
                      ? m['studio.resolution']()
                      : m['studio.duration']()
                }
                options={model.fields[k]!.options!}
                value={values[k]}
                onChange={(v) => setOpts((o) => ({ ...o, [k]: v }))}
                format={k === 'duration' ? fmtDuration : undefined}
              />
            ))}

          {fields.includes('audio') && (
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={values.audio === true}
                onChange={(e) =>
                  setOpts((o) => ({ ...o, audio: e.target.checked }))
                }
                className="size-4 accent-[var(--brand)]"
              />
              {m['studio.audio']()}
            </label>
          )}

          <div className="space-y-3">
            <p
              className="text-muted-foreground font-mono text-sm"
              aria-live="polite"
            >
              {m['studio.price']({
                credits: String(cost),
                usd: creditsToUsd(cost),
              })}
            </p>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={busy || (signedIn && lacksCredits)}
              className="h-12 w-full gap-2 rounded-full text-base font-semibold"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {signedIn ? m['studio.submit']() : m['studio.signin']()}
            </Button>
            {signedIn && creditsQuery.isSuccess && (
              <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{m['studio.balance']({ count: String(balance) })}</span>
                {lacksCredits && (
                  <span className="text-destructive">
                    {m['studio.no_credits']()}
                  </span>
                )}
                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({
                      size: 'sm',
                      variant: lacksCredits ? 'default' : 'outline',
                    }),
                    'rounded-full'
                  )}
                >
                  {m['studio.get_credits']()}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 结果 */}
        <div className="bg-muted/60 flex flex-col p-5 shadow-[inset_0_1px_0_var(--line)] sm:p-8 lg:shadow-[inset_1px_0_0_var(--line)]">
          <p className="mb-3 text-sm font-semibold">{m['studio.result']()}</p>
          <div
            className={cn(
              'g5 relative flex w-full items-center justify-center overflow-hidden rounded-[var(--r2)] shadow-[inset_0_0_0_1px_var(--line)]',
              model.kind === 'video' ? 'aspect-video' : 'aspect-square'
            )}
          >
            {out?.kind === 'video' ? (
              <video
                key={out.url}
                src={out.url}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
            ) : out ? (
              <img
                src={out.url}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : isRunning(task) ? (
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <Loader2
                  className="size-8 animate-spin text-[#1e2340]"
                  aria-hidden="true"
                />
                <div className="h-1 w-48 overflow-hidden rounded-full bg-[#1e2340]/15">
                  <div className="h-full w-1/3 animate-[loading_1.6s_ease-in-out_infinite] rounded-full bg-[var(--brand)]" />
                </div>
              </div>
            ) : (
              <p className="px-6 text-center text-sm text-[#1e2340]/70">
                {m['studio.empty']()}
              </p>
            )}
          </div>
          <p aria-live="polite" className="mt-4 min-h-6 text-sm">
            {statusText}
          </p>

          {out && (
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={out.url}
                download
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'gap-2 rounded-full'
                )}
              >
                <Download className="size-4" aria-hidden="true" />
                {m['studio.download']()}
              </a>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => {
                  setActiveId(null);
                  writeActive(null);
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {m['studio.again']()}
              </Button>
            </div>
          )}

          {recent.length > 0 && (
            <div className="mt-auto pt-6">
              <p className="text-muted-foreground mb-2 text-xs font-semibold">
                {m['studio.recent']()}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {recent.map((t) => {
                  const o = t.outputs[0];
                  const name = getTool(t.toolId)
                    ? copyOf(getTool(t.toolId)!).name
                    : '';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={`${name} ${getModel(t.modelId)?.label ?? ''}`}
                      onClick={() => {
                        setActiveId(t.id);
                        queryClient.setQueryData(['ai-task', t.id], t);
                      }}
                      className="overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--line)] transition hover:-translate-y-0.5"
                    >
                      {o.kind === 'video' ? (
                        <video
                          src={o.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <img
                          src={o.url}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
