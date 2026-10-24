import { Camera, Clapperboard, MapPin } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { SectionHead } from '@/blocks/section-head';

export function HowItWorks() {
  const steps = [
    {
      icon: Camera,
      title: m['landing.how.step1.title'](),
      desc: m['landing.how.step1.desc'](),
    },
    {
      icon: MapPin,
      title: m['landing.how.step2.title'](),
      desc: m['landing.how.step2.desc'](),
    },
    {
      icon: Clapperboard,
      title: m['landing.how.step3.title'](),
      desc: m['landing.how.step3.desc'](),
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow={m['landing.how.eyebrow']()}
          title={m['landing.how.title']()}
          em={m['landing.how.title_em']()}
        />
        <ol className="grid gap-5 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} data-reveal-card className="card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full font-mono text-sm">
                    {i + 1}
                  </span>
                  <Icon className="text-primary size-5" aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {s.desc}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
