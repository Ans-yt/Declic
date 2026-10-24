import type { CSSProperties } from 'react';

const FIRST_ICON_DOTS = [0, 2, 2, 1, 2, 0, 1, 1, 2, 2, 0, 1, 0, 2, 2, 1, 0, 2, 2, 2, 2, 0, 1, 0, 2];
const SECOND_ICON_DOTS = [0, 2, 2, 1, 2, 0, 1, 1, 2];

export function Button04({
  text,
  href = '#cv',
  className = '',
}: {
  text: string;
  href?: string;
  className?: string;
}) {
  return <a href={href} className={`button04${className ? ` ${className}` : ''}`}>
    <span className="button04_bg" aria-hidden="true" />
    <span className="button04_inner">
      <span className="button04_text">{text}</span>
      <span className="button04_icon-wrap" aria-hidden="true">
        <span style={{ '--index-parent': 0 } as CSSProperties} className="button04_icon">
          {FIRST_ICON_DOTS.map((index, position) => <span
            key={`matrix-${position}`}
            style={{ '--index': index } as CSSProperties}
            className="button04_dot"
          />)}
        </span>
        <span style={{ '--index-parent': 1 } as CSSProperties} className="button04_icon is-arrow">
          {SECOND_ICON_DOTS.map((index, position) => <span
            key={`arrow-${position}`}
            style={{ '--index': index } as CSSProperties}
            className="button04_dot"
          />)}
        </span>
      </span>
    </span>
  </a>;
}
