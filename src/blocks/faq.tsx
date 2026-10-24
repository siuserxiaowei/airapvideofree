import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_KEYS = ['what', 'time', 'photo', 'refund', 'privacy'] as const;

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="display h2">
            {m['landing.faq.title']()}
            <em>{m['landing.faq.title_em']()}</em>
          </h2>
          <p className="lead mx-auto mt-4">{m['landing.faq.description']()}</p>
        </div>
        <Accordion className="w-full">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="cursor-pointer py-6 text-left text-base font-medium hover:no-underline">
                {tDynamic(`landing.faq.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                {tDynamic(`landing.faq.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
