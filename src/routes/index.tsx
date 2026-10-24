import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { HOME_TOOL } from '@/config/site';
import { m } from '@/paraglide/messages.js';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { Blog } from '@/blocks/blog';
import { CTA } from '@/blocks/cta';
import { FAQ } from '@/blocks/faq';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Hero } from '@/blocks/hero';
import { HowItWorks } from '@/blocks/how-it-works';
import { Pricing } from '@/blocks/pricing';
import { Showcase } from '@/blocks/showcase';
import { SupportWidget } from '@/blocks/support-widget';
import { ToolCards } from '@/blocks/tool-cards';
import { WhatIs } from '@/blocks/what-is';
import { PopstyleMotion } from '@/components/popstyle-motion';
import { getBlogPostsFn } from '@/content/posts/server';

function HomePage() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main>
        <Hero />
        <Showcase />
        <ToolCards type="effect" />
        <ToolCards type="tool" exclude={HOME_TOOL} />
        <HowItWorks />
        <WhatIs />
        <Pricing />
        <FAQ />
        <Blog posts={posts} />
        <CTA />
      </main>
      <Footer />
      <SupportWidget />
      <PopstyleMotion />
    </div>
  );
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const locale = getLocale();
    const posts = await getBlogPostsFn({ data: { locale, limit: 3 } });
    return { locale, posts };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/`, { locale: loc as any }).href;
    return {
      meta: [
        { title: m['common.metadata.title']({}, { locale: locale as any }) },
        {
          name: 'description',
          content: m['common.metadata.description'](
            {},
            { locale: locale as any }
          ),
        },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor('en') },
      ],
    };
  },
  component: HomePage,
});
