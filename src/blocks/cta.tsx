import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { buttonVariants } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="px-4 pb-24 sm:pb-24">
      <div className="mx-auto max-w-5xl">
        <div
          data-reveal-card
          className="card grid overflow-hidden rounded-[var(--r3)] md:grid-cols-[1.1fr_1fr]"
        >
          <div className="px-6 py-12 sm:px-12 sm:py-16">
            <h2 className="display h2">
              {m['landing.cta.headline']()}
              <em>{m['landing.cta.headline_em']()}</em>
            </h2>
            <p className="lead mt-6">{m['landing.cta.subheadline']()}</p>
            <div className="mt-8 flex">
              <Link
                href="/#generator"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-12 gap-2 rounded-full px-8'
                )}
              >
                {m['landing.cta.button']()}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="g6 min-h-56" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
