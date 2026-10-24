import { useEffect } from 'react';

/**
 * popstyle 入场动画：[data-split] 标题按行升起，[data-reveal] 随后淡入，
 * [data-reveal-card] 滚动到视口时浮现。系统开了减少动态效果就什么都不做
 */
export function PopstyleMotion() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('gsap/SplitText'),
      ]);
      await document.fonts.ready;
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      const ctx = gsap.context(() => {
        const ease = 'expo.out';
        const tl = gsap.timeline();
        document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
          const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
          tl.from(
            split.lines,
            { yPercent: 110, duration: 1.1, ease, stagger: 0.09 },
            0
          );
        });
        tl.from(
          '[data-reveal]',
          { y: 18, opacity: 0, duration: 0.8, ease, stagger: 0.08 },
          0.35
        );
        gsap.utils
          .toArray<HTMLElement>('[data-reveal-card]')
          .forEach((el, i) => {
            gsap.from(el, {
              y: 36,
              opacity: 0,
              duration: 0.9,
              ease,
              delay: (i % 4) * 0.06,
              scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            });
          });
      });
      revert = () => ctx.revert();
    })();
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);
  return null;
}
