import { SHOWCASE } from '@/config/site';
import { m } from '@/paraglide/messages.js';
import { SectionHead } from '@/blocks/section-head';
import { prefillStudio } from '@/blocks/studio';

const PLACEHOLDERS = [
  'g1 h-a',
  'g3 h-c',
  'g2 h-b',
  'g5 h-d',
  'g4 h-a',
  'g6 h-b',
  'g3 h-d',
  'g1 h-c',
];

/**
 * 作品墙：读 config/site.ts 的 SHOWCASE。
 * 没有真实作品时显示占位色块，并在开发环境提示补作品
 */
export function Showcase() {
  const items = SHOWCASE;
  return (
    <section className="px-4 py-16 sm:py-24" aria-labelledby="showcase-h">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          id="showcase-h"
          eyebrow={m['landing.showcase.eyebrow']()}
          title={m['landing.showcase.title']()}
          em={m['landing.showcase.title_em']()}
          lead={m['landing.showcase.lead']()}
          action={
            <a className="btn" href="#studio">
              {m['landing.showcase.cta']()}
            </a>
          }
        />
        <div className="masonry">
          {items.length > 0
            ? items.map((it, i) => (
                <figure key={i} data-reveal-card className="work card lift">
                  {it.kind === 'video' ? (
                    <video
                      className="media"
                      src={it.src}
                      poster={it.poster}
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img className="media" src={it.src} alt="" loading="lazy" />
                  )}
                  <span className="model glass">{it.model}</span>
                  {it.toolId && (
                    <button
                      type="button"
                      className="pill glass absolute top-2.5 right-2.5"
                      onClick={() =>
                        prefillStudio({ toolId: it.toolId!, prompt: it.prompt })
                      }
                    >
                      {m['landing.showcase.remix']()}
                    </button>
                  )}
                </figure>
              ))
            : PLACEHOLDERS.map((c, i) => (
                <figure
                  key={i}
                  data-reveal-card
                  className="work card"
                  aria-hidden="true"
                >
                  <div className={`media ${c}`} />
                </figure>
              ))}
        </div>
        {items.length === 0 && import.meta.env.DEV && (
          <p className="text-muted-foreground mt-4 text-sm">
            TODO(site): 在 src/config/generator.ts 的 SHOWCASE
            里放真实生成的作品
          </p>
        )}
      </div>
    </section>
  );
}
