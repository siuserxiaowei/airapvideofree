import { Link } from '@/core/i18n/navigation';
import { TOOLS, type ToolDef } from '@/config/ai';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { SectionHead } from '@/blocks/section-head';

const GRADIENTS = ['g6', 'g1', 'g4', 'g3', 'g2', 'g5'];

export function toolHref(t: ToolDef) {
  return t.type === 'effect' ? `/effects/${t.id}` : `/tools/${t.id}`;
}

/** 特效或工具卡片墙：每张卡链到自己的页面 */
export function ToolCards({
  type,
  exclude,
  heading = true,
}: {
  type: ToolDef['type'];
  exclude?: string;
  heading?: boolean;
}) {
  const zh = getLocale() === 'zh';
  const items = TOOLS.filter((t) => t.type === type && t.id !== exclude);
  if (!items.length) return null;
  const effect = type === 'effect';
  return (
    <section className="px-4 py-16 sm:py-24" aria-labelledby={`cards-${type}`}>
      <div className="mx-auto max-w-6xl">
        {heading && (
          <SectionHead
            id={`cards-${type}`}
            eyebrow={
              effect ? m['cards.effects_eyebrow']() : m['cards.tools_eyebrow']()
            }
            title={
              effect ? m['cards.effects_title']() : m['cards.tools_title']()
            }
            em={effect ? m['cards.effects_em']() : m['cards.tools_em']()}
            action={
              effect ? (
                <Link className="btn" href="/effects">
                  {m['cards.effects_all']()}
                </Link>
              ) : undefined
            }
          />
        )}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((t, i) => {
            const c = zh ? t.copy.zh : t.copy.en;
            return (
              <Link
                key={t.id}
                href={toolHref(t)}
                data-reveal-card
                className="trend card lift"
              >
                {t.preview?.video ? (
                  <video
                    className="media object-cover"
                    src={t.preview.video}
                    poster={t.preview.image}
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  />
                ) : t.preview?.image ? (
                  <img
                    className="media object-cover"
                    src={t.preview.image}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`media ${GRADIENTS[i % GRADIENTS.length]}`}
                    aria-hidden="true"
                  />
                )}
                <div className="row">
                  <h3>{c.name}</h3>
                  {t.tag && (
                    <span
                      className={`tag ${t.tag === 'rising' ? 'rising' : t.tag === 'new' ? 'new' : ''}`}
                    >
                      {t.tag === 'hot'
                        ? 'Hot'
                        : t.tag === 'new'
                          ? 'New'
                          : 'Rising'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
