'use client';

import { useEffect, useState } from 'react';

const COLORS = [
  'oklch(58% 0.13 35)',
  'oklch(46% 0.09 135)',
  'oklch(88% 0.09 80)',
  'oklch(52% 0.13 145)',
]; // TODO: VISIBE COLORS, GOOD FOR PHONE

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

/** Digital confetti for the completion screen. Respects prefers-reduced-motion via CSS. */
export function Confetti({ count = 90 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  /* Generated after mount so server and client markup match. */
  useEffect(() => {
    setPieces(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.2,
        duration: 2.8 + Math.random() * 2.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotate: Math.random() * 360,
      })),
    );
  }, [count]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-layer" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
