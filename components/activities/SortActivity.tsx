'use client';

import { useMemo, useState } from 'react';
import { FEEDBACK, SortActivity as SortActivityData } from '@/content/module';
import { ConstitutionModal } from '../ConstitutionModal';
import { FeedbackPanel } from '../Feedback';
import { Highlighted } from '../RichText';

type Placements = Record<string, string | undefined>;

export function SortActivity({
  data,
  done,
  onComplete,
}: {
  data: SortActivityData;
  done: boolean;
  onComplete: () => void;
}) {
  const [placements, setPlacements] = useState<Placements>({});
  /** Item ids confirmed correct — these lock in place. */
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overBucket, setOverBucket] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const solved = done || locked.size === data.items.length;

  const tray = useMemo(
    () => data.items.filter((it) => !placements[it.id]),
    [data.items, placements],
  );

  const allPlaced = tray.length === 0;

  function place(itemId: string, bucketId: string) {
    if (locked.has(itemId) || solved) return;
    setPlacements((p) => ({ ...p, [itemId]: bucketId }));
    setSelected(null);
    setChecked(false);
    setWrong((w) => {
      const next = new Set(w);
      next.delete(itemId);
      return next;
    });
  }

  function returnToTray(itemId: string) {
    if (locked.has(itemId) || solved) return;
    setPlacements((p) => {
      const next = { ...p };
      delete next[itemId];
      return next;
    });
    setChecked(false);
  }

  function check() {
    const nextLocked = new Set(locked);
    const nextWrong = new Set<string>();
    for (const item of data.items) {
      const placed = placements[item.id];
      if (!placed) continue;
      if (placed === item.bucketId) nextLocked.add(item.id);
      else nextWrong.add(item.id);
    }
    setLocked(nextLocked);
    setWrong(nextWrong);
    setChecked(true);
    if (nextWrong.size === 0 && nextLocked.size === data.items.length) onComplete();
  }

  function clearWrong() {
    setPlacements((p) => {
      const next = { ...p };
      for (const id of wrong) delete next[id];
      return next;
    });
    setWrong(new Set());
    setChecked(false);
  }

  function verdictFor(itemId: string): 'correct' | 'wrong' | undefined {
    if (solved || locked.has(itemId)) return 'correct';
    if (checked && wrong.has(itemId)) return 'wrong';
    return undefined;
  }

  return (
    <>
      <p className="eyebrow">פעילות יישום</p>
      <h2 className="section-heading">{data.heading}</h2>
      <p className="body-p">{data.instruction}</p>

      {!solved && (
        <>
          <div
            className="chip-tray"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging) returnToTray(dragging);
              setDragging(null);
            }}
            aria-label="היגדים למיון"
          >
            {tray.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>
                כל ההיגדים מוינו. אפשר לבדוק.
              </p>
            ) : (
              tray.map((item) => (
                <button
                  key={item.id}
                  className="chip"
                  draggable
                  data-selected={selected === item.id}
                  data-dragging={dragging === item.id}
                  onDragStart={() => setDragging(item.id)}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => setSelected(selected === item.id ? null : item.id)}
                  aria-pressed={selected === item.id}
                >
                  {item.text}
                </button>
              ))
            )}
          </div>
          <p className="hint">
            גררו היגד אל הרשות המתאימה, או הקישו על היגד ואז על הרשות שאליה הוא שייך.
          </p>
        </>
      )}

      <div className="bucket-grid">
        {data.buckets.map((bucket) => {
          const items = data.items.filter((it) => placements[it.id] === bucket.id);
          return (
            <div
              key={bucket.id}
              className="bucket"
              data-over={overBucket === bucket.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverBucket(bucket.id);
              }}
              onDragLeave={() => setOverBucket(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOverBucket(null);
                if (dragging) place(dragging, bucket.id);
                setDragging(null);
              }}
              onClick={() => {
                if (selected) place(selected, bucket.id);
              }}
            >
              <h3 className="bucket-title">
                <Highlighted text={bucket.label} />
                <span className="bucket-count">({items.length})</span>
              </h3>
              <div className="bucket-items">
                {items.map((item) => (
                  <button
                    key={item.id}
                    className="chip"
                    data-verdict={verdictFor(item.id)}
                    draggable={!locked.has(item.id) && !solved}
                    onDragStart={() => setDragging(item.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      returnToTray(item.id);
                    }}
                    disabled={locked.has(item.id) || solved}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {solved ? (
        <FeedbackPanel verdict="correct" message={FEEDBACK.correct} />
      ) : checked && wrong.size > 0 ? (
        <>
          <FeedbackPanel
            verdict="wrong"
            message={`${FEEDBACK.incorrect} ${wrong.size} היגדים אינם ברשות הנכונה.`}
            onOpenConstitution={() => setShowModal(true)}
          />
          <button className="btn btn-ghost" onClick={clearWrong} style={{ marginTop: 12 }}>
            החזרת ההיגדים השגויים ותיקון
          </button>
        </>
      ) : (
        <button
          className="btn btn-primary"
          onClick={check}
          disabled={!allPlaced}
          style={{ marginTop: 18 }}
        >
          בדיקת המיון
        </button>
      )}

      {showModal && (
        <ConstitutionModal excerpt={data.constitutionExcerpt} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
