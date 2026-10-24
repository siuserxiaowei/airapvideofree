import { createFileRoute, notFound } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { getModel, TOOLS } from '@/config/ai';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { ToolPage } from '@/blocks/tool-page';

/** 模型页：用这个模型的第一个通用工具，默认选中这个模型 */
function toolFor(modelId: string) {
  return TOOLS.find((t) => t.type === 'tool' && t.models.includes(modelId));
}

export const Route = createFileRoute('/models/$slug')({
  loader: ({ params }) => {
    const model = getModel(params.slug);
    const tool = model && toolFor(model.id);
    if (!model || !tool) throw notFound();
    const locale = getLocale();
    return {
      modelId: model.id,
      toolId: tool.id,
      title: `${m['tool_page.model_title']({ model: model.label }, { locale })} | ${envConfigs.app_name}`,
      description: locale === 'zh' ? model.summary.zh : model.summary.en,
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
    const { modelId, toolId } = Route.useLoaderData();
    return (
      <ToolPage
        tool={TOOLS.find((t) => t.id === toolId)!}
        model={getModel(modelId)}
      />
    );
  },
});
