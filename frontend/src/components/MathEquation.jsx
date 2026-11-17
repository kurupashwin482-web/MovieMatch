import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const MathEquation = ({
  math = '',
  display = true,
  className = '',
  ariaLabel,
}) => {
  const renderedHtml = useMemo(() => {
    if (!math || typeof math !== 'string') return '';

    // Strip accidental leading/trailing dollar signs
    let cleaned = math.trim();
    if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
      cleaned = cleaned.slice(2, -2).trim();
    } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    try {
      return katex.renderToString(cleaned, {
        displayMode: Boolean(display),
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          '\\operatorname': '\\mathop{\\mathrm{#1}}',
        },
      });
    } catch (err) {
      console.warn('KaTeX rendering error:', err);
      return `<span class="math-fallback">${cleaned}</span>`;
    }
  }, [math, display]);

  if (display) {
    return (
      <div
        className={`math-block-container ${className}`}
        aria-label={ariaLabel || 'Mathematical formula'}
        tabIndex={0}
      >
        <div
          className="math-block-inner"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    );
  }

  return (
    <span
      className={`math-inline ${className}`}
      aria-label={ariaLabel || 'Mathematical symbol'}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
