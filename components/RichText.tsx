'use client';

import { Fragment, useMemo } from 'react';
import { Block, KEY_TERMS } from '@/content/module';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Longest-first, so "הרשות המחוקקת" wins over the shorter terms inside it. */
const TERM_RE = new RegExp(
  `(${[...KEY_TERMS]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')})`,
  'g',
);

/** Hebrew letters, Latin letters and digits all count as "inside a word". */
const WORD_CHAR = /[֐-׿A-Za-z0-9]/;

/** Terms that mean the same thing, so only one of them highlights per slide. */
function conceptOf(term: string): string {
  if (/פרלמנט/.test(term)) return 'parliament';
  if (/חונך|חונכות/.test(term)) return 'mentor';
  if (/עמותה/.test(term)) return 'association';
  if (/ועד/.test(term)) return 'committee';
  if (/אחריות/.test(term)) return 'responsibility';
  if (/בחירה/.test(term)) return 'choice';
  return term;
}

interface Segment {
  text: string;
  term: boolean;
}

/**
 * Splits text into plain and highlighted segments.
 *
 * A match only counts when it is a whole word: Hebrew has no usable \b, and
 * without this check a term like "ועדה" would highlight the middle of an
 * unrelated word such as "נועדה". Prefixed forms ("בפרלמנט") are listed
 * explicitly in KEY_TERMS rather than matched loosely.
 *
 * `seen` carries across a slide so each concept is highlighted only on its
 * first appearance — highlighting every occurrence makes the page unreadable.
 */
function segment(text: string, seen: Set<string>): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  TERM_RE.lastIndex = 0;
  for (const match of text.matchAll(TERM_RE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const before = start > 0 ? text[start - 1] : '';
    const after = end < text.length ? text[end] : '';
    if (WORD_CHAR.test(before) || WORD_CHAR.test(after)) continue;
    const concept = conceptOf(match[0]);
    if (seen.has(concept)) continue;
    seen.add(concept);
    if (start > cursor) out.push({ text: text.slice(cursor, start), term: false });
    out.push({ text: match[0], term: true });
    cursor = end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), term: false });
  return out;
}

function renderSegments(parts: Segment[]) {
  return parts.map((part, i) =>
    part.term ? (
      <span className="term" key={i}>
        {part.text}
      </span>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    ),
  );
}

/**
 * Wraps key terms in a coloured highlight. Purely presentational — the text
 * itself is never altered, only split and re-joined.
 */
export function Highlighted({ text }: { text: string }) {
  const parts = useMemo(() => segment(text, new Set()), [text]);
  return <>{renderSegments(parts)}</>;
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  /* One `seen` set per group of blocks, so a concept highlights once per slide. */
  const segmented = useMemo(() => {
    const seen = new Set<string>();
    return blocks.map((block) =>
      block.type === 'paragraph'
        ? { type: 'paragraph' as const, parts: segment(block.text, seen) }
        : { type: 'list' as const, items: block.items.map((item) => segment(item, seen)) },
    );
  }, [blocks]);

  return (
    <>
      {segmented.map((block, i) =>
        block.type === 'paragraph' ? (
          <p className="body-p" key={i}>
            {renderSegments(block.parts)}
          </p>
        ) : (
          <ul className="body-list" key={i}>
            {block.items.map((parts, j) => (
              <li key={j}>{renderSegments(parts)}</li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}
