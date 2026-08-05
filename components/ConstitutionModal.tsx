'use client';

import { useEffect, useRef } from 'react';
import { Block, FEEDBACK } from '@/content/module';
import { Blocks } from './RichText';

/**
 * A real, focus-trapped, closeable dialog — not static inline text.
 * Required by developer_instructions.docx:
 * "ה-popup חייב להיות אמיתי, לא טקסט סטטי... החלון יאפשר סגירה וחזרה לשאלה."
 */
export function ConstitutionModal({
  excerpt,
  onClose,
}: {
  excerpt: Block[];
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="constitution-title"
        ref={panelRef}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">מתוך חוקת בית הספר</p>
            <h2 className="section-heading" id="constitution-title" style={{ margin: 0 }}>
              {FEEDBACK.popupTrigger}
            </h2>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="סגירת החלון וחזרה לשאלה"
            ref={closeRef}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 18 }}>
          <Blocks blocks={excerpt} />
        </div>

        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 8 }}>
          חזרה לשאלה
        </button>
      </div>
    </div>
  );
}
