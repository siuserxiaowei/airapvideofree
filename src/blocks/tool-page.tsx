import type { ModelDef, ToolDef } from '@/config/ai';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { CTA } from '@/blocks/cta';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { HowItWorks } from '@/blocks/how-it-works';
import { Studio } from '@/blocks/studio';
import { ToolCards } from '@/blocks/tool-cards';
import { PopstyleMotion } from '@/components/popstyle-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * 工具页、特效页、模型页共用的页面：标题 + 工作台 + 常见问题 + 其他特效。
 * 内容全部来自 config/ai 的配置，加一条配置就多一个页面
 */
export function ToolPage({ tool, model }: { tool: ToolDef; model?: ModelDef }) {
  const zh = getLocale() === 'zh';
  const c = zh ? tool.copy.zh : tool.copy.en;
  const h1 = model ? model.label : c.h1;
  const em = model ? m['tool_page.model_em']() : c.h1Em;
  const lead = model
    ? zh
      ? model.summary.zh
      : model.summary.en
    : c.description;
  const eyebrow = model
    ? m['tool_page.model_eyebrow']({ vendor: model.vendor })
    : tool.type === 'effect'
      ? m['tool_page.effect_eyebrow']()
      : m['tool_page.tool_eyebrow']();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="px-4 pt-20 pb-12 sm:pt-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="eyebrow mb-5">{eyebrow}</p>
              <h1 data-split className="display h1">
                {h1}
                {model ? ' ' : ''}
                <em>{em}</em>
              </h1>
              <p data-reveal className="lead mx-auto mt-6">
                {lead}
              </p>
            </div>
            <div data-reveal>
              <Studio toolIds={[tool.id]} initialModelId={model?.id} />
            </div>
          </div>
        </section>

        {c.faq && c.faq.length > 0 && (
          <section className="px-4 py-16 sm:py-24">
            <div className="mx-auto max-w-3xl">
              <h2 className="display h2 mb-8 text-center">
                {m['landing.faq.title']()}
                <em>{m['landing.faq.title_em']()}</em>
              </h2>
              <Accordion className="w-full">
                {c.faq.map((f, i) => (
                  <AccordionItem key={i} value={`f${i}`}>
                    <AccordionTrigger className="cursor-pointer py-5 text-left text-base font-medium hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        <ToolCards type="effect" exclude={tool.id} />
        <HowItWorks />
        <ToolCards type="tool" exclude={tool.id} />
        <CTA />
      </main>
      <Footer />
      <PopstyleMotion />
    </div>
  );
}
