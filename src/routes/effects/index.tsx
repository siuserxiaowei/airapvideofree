import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ToolCards } from '@/blocks/tool-cards';
import { PopstyleMotion } from '@/components/popstyle-motion';

export const Route = createFileRoute('/effects/')({
  loader: () => {
    const locale = getLocale();
    return {
      title: `${m['cards.effects_page_title']({}, { locale })} | ${envConfigs.app_name}`,
      description: m['cards.effects_page_description']({}, { locale }),
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
  component: EffectsPage,
});

function EffectsPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-12">
        <div className="mx-auto max-w-3xl px-4 pt-12 text-center">
          <h1 data-split className="display h1">
            {m['cards.effects_title']()}
            <em>{m['cards.effects_em']()}</em>
          </h1>
          <p data-reveal className="lead mx-auto mt-6">
            {m['cards.effects_page_description']()}
          </p>
        </div>
        <ToolCards type="effect" heading={false} />
      </main>
      <Footer />
      <PopstyleMotion />
    </div>
  );
}
