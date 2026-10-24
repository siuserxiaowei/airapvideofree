import { HOME_TOOL, HOME_TOOLS } from '@/config/site';
import { m } from '@/paraglide/messages.js';
import { Studio } from '@/blocks/studio';

/** 首页首屏：小标签 + 招牌标题 + 一句说明 + 工作台 */
export function Hero() {
  return (
    <section className="relative px-4 pt-20 pb-12 sm:pt-28 sm:pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <p className="eyebrow mb-5">{m['landing.hero.eyebrow']()}</p>
          <h1 data-split className="display h1">
            {m['landing.hero.headline']()}
            <br />
            <em>{m['landing.hero.headline_em']()}</em>
          </h1>
          <p data-reveal className="lead mx-auto mt-6">
            {m['landing.hero.subheadline']()}
          </p>
        </div>
        <div data-reveal>
          <Studio toolIds={HOME_TOOLS} initialToolId={HOME_TOOL} />
        </div>
      </div>
    </section>
  );
}
