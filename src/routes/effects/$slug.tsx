import { createFileRoute, notFound } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { getTool } from '@/config/ai';
import { getLocale } from '@/paraglide/runtime.js';
import { ToolPage } from '@/blocks/tool-page';

export const Route = createFileRoute('/effects/$slug')({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool || tool.type !== 'effect') throw notFound();
    const c = getLocale() === 'zh' ? tool.copy.zh : tool.copy.en;
    return {
      id: tool.id,
      title: `${c.name} | ${envConfigs.app_name}`,
      description: c.description,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: () => {
    const { id } = Route.useLoaderData();
    return <ToolPage tool={getTool(id)!} />;
  },
});
