'use client';

import { useEffect, useState } from 'react';
import { BoardActivity as BoardActivityData } from '@/content/module';
import { Blocks } from '../RichText';

interface Note {
  name: string;
  initiative: string;
}

export function BoardActivity({
  data,
  done,
  onComplete,
}: {
  data: BoardActivityData;
  done: boolean;
  onComplete: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [name, setName] = useState('');
  const [initiative, setInitiative] = useState('');
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(done);
  const [error, setError] = useState<string | null>(null);

  /* Load whatever the community has already pinned to the shared board. */
  useEffect(() => {
    let active = true;
    fetch('/api/corkboard')
      .then((r) => (r.ok ? r.json() : { notes: [] }))
      .then((d) => {
        if (!active || !Array.isArray(d.notes)) return;
        /* Append rather than replace: this request can resolve after the
           learner has already pinned their own note, and overwriting would
           make it vanish. */
        setNotes((current) => [...current, ...d.notes]);
      })
      .catch(() => {
        /* board still works locally if the sheet is unreachable */
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !initiative.trim()) return;
    const note = { name: name.trim(), initiative: initiative.trim() };
    setPosting(true);
    setError(null);
    try {
      const res = await fetch('/api/corkboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      /* The learner's note is still shown; the teacher is warned it may not
         have reached the sheet. Never blocks module completion. */
      setError('הפתק נוסף ללוח, אך ייתכן שהשמירה במערכת לא הושלמה.');
    } finally {
      setNotes((n) => [note, ...n]);
      setName('');
      setInitiative('');
      setPosting(false);
      setPosted(true);
      onComplete();
    }
  }

  return (
    <>
      <p className="eyebrow">פעילות יישום</p>
      <h2 className="section-heading">{data.heading}</h2>

      <Blocks blocks={data.blocks} />

      <form onSubmit={submit} style={{ marginTop: 8 }}>
        <div className="field">
          <label className="field-label" htmlFor="board-name">
            שמכם המלא
          </label>
          <span className="field-hint">{data.nameFieldLabel}</span>
          <input
            id="board-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="board-initiative">
            מה היוזמה או המעורבות שלכם?
          </label>
          <span className="field-hint">{data.initiativeFieldLabel}</span>
          <textarea
            id="board-initiative"
            className="textarea"
            value={initiative}
            onChange={(e) => setInitiative(e.target.value)}
            required
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={posting || !name.trim() || !initiative.trim()}
        >
          {posting ? 'מוסיפים פתק...' : 'הוספת פתק ללוח'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      <div className="corkboard" aria-live="polite">
        {notes.length === 0 ? (
          <p className="corkboard-empty">הלוח עדיין ריק — הוסיפו את הפתק הראשון.</p>
        ) : (
          notes.map((note, i) => (
            <div className="sticky" key={i}>
              <div className="sticky-name">{note.name}</div>
              <div>{note.initiative}</div>
            </div>
          ))
        )}
      </div>

      <p className="body-p" style={{ marginTop: 24 }}>
        {data.examplesIntro}
      </p>
      <div className="examples">
        {data.examples.map((example) => (
          <span className="example-chip" key={example}>
            {example}
          </span>
        ))}
      </div>

      {posted && (
        <p className="hint" style={{ color: 'var(--olive)', marginTop: 18 }}>
          תודה! הפתק שלכם נוסף ללוח — אפשר להמשיך.
        </p>
      )}
    </>
  );
}
