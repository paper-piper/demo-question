'use client';

import { useState } from 'react';

export function RebuildButton({ secretKey }: { secretKey: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function trigger() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: secretKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(
          res.status === 404
            ? 'הקישור לא תקין. בקשו קישור עדכני.'
            : (data.error ?? 'משהו השתבש, נסו שוב.'),
        );
        return;
      }
      setStatus('done');
      setMessage('הבנייה מחדש הופעלה. השינויים יופיעו באתר בעוד כמה דקות.');
    } catch {
      setStatus('error');
      setMessage('שגיאה בחיבור לשרת.');
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={trigger}
        disabled={status === 'loading' || status === 'done'}
      >
        {status === 'loading' ? 'מפעיל בנייה...' : 'עדכן את האתר עם השאלות החדשות'}
      </button>
      {message && (
        <p className="body-p" style={{ marginTop: 12 }}>
          {message}
        </p>
      )}
    </div>
  );
}
