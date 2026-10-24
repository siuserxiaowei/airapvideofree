import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import { startGeneration } from '@/modules/ai-tasks/generation';
import { getAllConfigs } from '@/modules/config/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

// 浏览器只能传工具、模型和用户输入；价格、提示词模板、供应商参数都由服务端按配置决定
const bodySchema = z.object({
  toolId: z.string().min(1).max(64),
  modelId: z.string().max(64).optional(),
  input: z.record(z.string(), z.unknown()),
});

async function POST({ request }: { request: Request }) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'ai-generate',
  });
  if (limited) return limited;

  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized');

    const userLimited = enforceMinIntervalRateLimit(request, {
      intervalMs: 3000,
      keyPrefix: 'ai-generate',
      extraKey: session.user.id,
    });
    if (userLimited) return userLimited;

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return respErr('Invalid request');

    const input = JSON.stringify(parsed.data.input);
    if (input.length > 8000) return respErr('Invalid request');
    const task = await startGeneration({
      userId: session.user.id,
      toolId: parsed.data.toolId,
      modelId: parsed.data.modelId,
      input: parsed.data.input,
      configs: await getAllConfigs(),
    });
    return respData(task);
  } catch (e: any) {
    return respErr(e?.message || 'Generation failed');
  }
}

export const Route = createFileRoute('/api/ai/generate')({
  server: { handlers: { POST } },
});
