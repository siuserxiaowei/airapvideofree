import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { advanceGeneration } from '@/modules/ai-tasks/generation';
import { getAllConfigs } from '@/modules/config/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

// Polled by the generator every few seconds; each call advances the pipeline.
async function GET({ request }: { request: Request }) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized');

    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1500,
      keyPrefix: 'ai-task',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const id = new URL(request.url).searchParams.get('id') || '';
    if (!/^[\w-]{8,64}$/.test(id)) return respErr('Invalid id');

    const task = await advanceGeneration({
      userId: session.user.id,
      id,
      configs: await getAllConfigs(),
    });
    if (!task) return respErr('Not found');
    return respData(task);
  } catch (e: any) {
    return respErr(e?.message || 'Failed to get task');
  }
}

export const Route = createFileRoute('/api/ai/task')({
  server: { handlers: { GET } },
});
