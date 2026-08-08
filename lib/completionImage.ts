/**
 * Renders a shareable "I finished!" image for the completion screen, so it
 * can be handed to the Web Share API and forwarded via WhatsApp. Built with
 * plain Canvas 2D rather than an extra dependency — the certificate itself
 * stays a DOM element for printing; this is a separate, social-friendly card.
 */

const SIZE = 1080;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Greedy word-wrap; returns the y position after the last line drawn. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, cx, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

export interface CompletionImageOptions {
  name: string;
  moduleName: string;
  date: Date;
}

export async function renderCompletionImage({
  name,
  moduleName,
  date,
}: CompletionImageOptions): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  try {
    await document.fonts?.ready;
  } catch {
    /* fall through with whatever fonts happen to be loaded */
  }

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  /* Reuse whatever font-family the live page already resolved for these
     roles, rather than hardcoding next/font's generated class names. */
  const headingFont =
    getComputedStyle(document.querySelector('.screen-title') ?? document.body).fontFamily;
  const bodyFont = getComputedStyle(document.body).fontFamily;

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  ctx.fillStyle = 'oklch(95.5% 0.008 75)';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const pad = 54;
  ctx.fillStyle = 'oklch(99% 0.008 75)';
  roundRect(ctx, pad, pad, SIZE - pad * 2, SIZE - pad * 2, 44);
  ctx.fill();

  ctx.strokeStyle = 'oklch(46% 0.09 135)';
  ctx.lineWidth = 3;
  roundRect(ctx, pad + 20, pad + 20, SIZE - (pad + 20) * 2, SIZE - (pad + 20) * 2, 30);
  ctx.stroke();

  ctx.font = `120px ${bodyFont}`;
  ctx.fillText('🎉', SIZE / 2, pad + 175);

  ctx.fillStyle = 'oklch(58% 0.13 35)';
  ctx.font = `600 30px ${headingFont}`;
  ctx.fillText('סיימתם!', SIZE / 2, pad + 245);

  ctx.fillStyle = 'oklch(24% 0.02 50)';
  ctx.font = `700 50px ${headingFont}`;
  let y = wrapText(ctx, 'מזל טוב! השלמתם בהצלחה את הלומדה', SIZE / 2, pad + 330, SIZE - pad * 2 - 100, 60);

  ctx.strokeStyle = 'oklch(58% 0.13 35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(SIZE / 2 - 70, y + 30);
  ctx.lineTo(SIZE / 2 + 70, y + 30);
  ctx.stroke();

  ctx.fillStyle = 'oklch(46% 0.09 135)';
  ctx.font = `800 62px ${headingFont}`;
  ctx.fillText(name, SIZE / 2, y + 130);

  ctx.fillStyle = 'oklch(46% 0.02 50)';
  ctx.font = `500 28px ${bodyFont}`;
  y = wrapText(ctx, moduleName, SIZE / 2, y + 200, SIZE - pad * 2 - 60, 40);

  const formatted = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  ctx.fillStyle = 'oklch(55% 0.02 60)';
  ctx.font = `400 24px ${bodyFont}`;
  ctx.fillText(formatted, SIZE / 2, SIZE - pad - 56);

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}
