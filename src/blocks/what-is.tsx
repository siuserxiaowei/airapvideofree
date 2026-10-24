import { m } from '@/paraglide/messages.js';
import { SectionHead } from '@/blocks/section-head';

/**
 * 「X 是什么」：给搜索引擎和 AI 搜索读的解释段落，写这个热词的来历和玩法。
 * 文案在 messages 的 landing.what.*，没有可以删掉这个区块
 */
export function WhatIs() {
  return (
    <section id="what-is" className="scroll-mt-20 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHead
          eyebrow={m['landing.what.eyebrow']()}
          title={m['landing.what.title']()}
          em={m['landing.what.title_em']()}
        />
        <div className="text-muted-foreground space-y-5 text-base leading-relaxed sm:text-lg">
          <p>{m['landing.what.p1']()}</p>
          <p>{m['landing.what.p2']()}</p>
          <p className="text-foreground">{m['landing.what.p3']()}</p>
        </div>
      </div>
    </section>
  );
}
