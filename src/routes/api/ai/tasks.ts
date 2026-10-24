import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { listGenerations } from '@/modules/ai-tasks/generation';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized');
    return respData({ items: await listGenerations(session.user.id) });
  } catch (e: any) {
    return respErr(e?.message || 'Failed to list tasks');
  }
}

export const Route = createFileRoute('/api/ai/tasks')({
  server: { handlers: { GET } },
});
