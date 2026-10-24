import type { ReactNode } from 'react';

/** 区块标题：小标签 + 招牌标题 + 说明，右侧可放按钮 */
export function SectionHead({
  eyebrow,
  title,
  em,
  lead,
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  em?: string;
  lead?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="display h2">
          {title}
          {em && <em>{em}</em>}
        </h2>
        {lead && <p className="lead mt-3">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
