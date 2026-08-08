'use client';

import { useState } from 'react';
import { MODULE_NAME } from '@/lib/config';
import { renderCompletionImage } from '@/lib/completionImage';

export function WhatsAppShare({ name, date }: { name: string; date: Date }) {
  const [state, setState] = useState<'idle' | 'working' | 'downloaded' | 'error'>('idle');

  async function share() {
    setState('working');
    try {
      const blob = await renderCompletionImage({ name, moduleName: MODULE_NAME, date });
      if (!blob) throw new Error('no blob');

      const file = new File([blob], 'סיום-הלומדה.png', { type: 'image/png' });
      const text = `סיימתי בהצלחה את הלומדה "${MODULE_NAME}"! 🎉`;

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        /* Opens the device's native share sheet with the image attached —
           the learner picks WhatsApp (or anything else) from there. */
        await navigator.share({ files: [file], title: MODULE_NAME, text });
        setState('idle');
        return;
      }

      /* Desktop / unsupported browsers: the Web Share API can't attach files
         at all, and wa.me only ever accepts text — there is no URL that hands
         WhatsApp an image. Download the picture and open a chat with the
         caption ready, so attaching it is one manual tap. */
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'סיום-הלומדה.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      setState('downloaded');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState('idle');
        return;
      }
      console.error('[WhatsAppShare] failed', err);
      setState('error');
    }
  }

  return (
    <>
      <button className="btn btn-secondary" onClick={share} disabled={state === 'working'}>
        {state === 'working' ? 'מכינים תמונה...' : 'שיתוף בוואטסאפ 🎉'}
      </button>
      {state === 'downloaded' && (
        <p className="hint" style={{ color: 'var(--olive)' }}>
          התמונה הורדה למכשיר, ופתחנו עבורכם שיחת וואטסאפ — צרפו את התמונה מהגלריה/הורדות
          לפני השליחה.
        </p>
      )}
      {state === 'error' && (
        <p className="error-text">לא הצלחנו להכין את התמונה. אפשר לנסות שוב.</p>
      )}
    </>
  );
}
