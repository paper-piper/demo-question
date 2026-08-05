'use client';

import { FEEDBACK } from '@/content/module';

export function FeedbackPanel({
  verdict,
  message,
  onOpenConstitution,
}: {
  verdict: 'correct' | 'wrong';
  message: string;
  onOpenConstitution?: () => void;
}) {
  return (
    <div
      className={`feedback ${verdict === 'correct' ? 'feedback-correct' : 'feedback-wrong'}`}
      role="status"
      aria-live="polite"
    >
      <span className="feedback-badge" aria-hidden>
        {verdict === 'correct' ? '✓' : '✕'}
      </span>
      <div>
        <span>{message}</span>
        {verdict === 'wrong' && onOpenConstitution && (
          <>
            {' '}
            <button className="btn-link" onClick={onOpenConstitution}>
              {FEEDBACK.popupTrigger}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
