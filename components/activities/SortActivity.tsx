'use client';

import { useRef, useState } from 'react';
import { FEEDBACK, SortActivity as SortActivityData } from '@/content/module';
import { ConstitutionModal } from '../ConstitutionModal';
import { FeedbackPanel } from '../Feedback';

/** Movement in px before a touch/mouse gesture counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 8;

export function SortActivity({
  data,
  done,
  onComplete,
}: {
  data: SortActivityData;
  done: boolean;
  onComplete: () => void;
}) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [overBucket, setOverBucket] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  const solved = done || locked.size === data.items.length;
  const queue = data.items.filter((it) => !placements[it.id]);
  const current = queue[0];
  const placedCount = data.items.length - queue.length;

  function place(itemId: string, bucketId: string) {
    setPlacements((p) => ({ ...p, [itemId]: bucketId }));
    setChecked(false);
    setWrong((w) => {
      if (!w.has(itemId)) return w;
      const next = new Set(w);
      next.delete(itemId);
      return next;
    });
  }

  function returnToDeck(itemId: string) {
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
      if (placements[item.id] === item.bucketId) nextLocked.add(item.id);
      else nextWrong.add(item.id);
    }
    setLocked(nextLocked);
    setWrong(nextWrong);
    setChecked(true);
    if (nextWrong.size === 0) onComplete();
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

  /* ---- pointer drag: works with touch, pen and mouse alike ---- */

  /* Bucket rects are captured on pointer-down: only the card moves during a
     drag, so these stay valid. Hit-testing rects avoids elementFromPoint,
     which would just return the dragged card sitting under the finger. */
  const rectsRef = useRef<{ id: string; rect: DOMRect }[]>([]);

  function bucketUnder(x: number, y: number): string | null {
    for (const { id, rect } of rectsRef.current) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return id;
    }
    return null;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!current) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    draggingRef.current = false;
    rectsRef.current = [...document.querySelectorAll('[data-bucket]')].map((el) => ({
      id: el.getAttribute('data-bucket') as string,
      rect: el.getBoundingClientRect(),
    }));
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!draggingRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    draggingRef.current = true;
    setDrag({ dx, dy });
    setOverBucket(bucketUnder(e.clientX, e.clientY));
  }

  function onPointerUp(e: React.PointerEvent) {
    const wasDragging = draggingRef.current;
    startRef.current = null;
    draggingRef.current = false;
    setDrag(null);
    setOverBucket(null);
    if (!wasDragging || !current) return;
    const target = bucketUnder(e.clientX, e.clientY);
    if (target) place(current.id, target);
  }

  const showDeck = !solved && !!current;
  const inReview = !solved && !current;

  return (
    <>
      <p className="eyebrow">פעילות יישום</p>
      <h2 className="section-heading">{data.heading}</h2>
      <p className="body-p">{data.instruction}</p>

      {showDeck && (
        <>
          <div className="sort-progress">
            <span>
              היגד {placedCount + 1} מתוך {data.items.length}
            </span>
            <div className="bar" style={{ flex: 1 }}>
              <div
                className="bar-fill"
                style={{ width: `${(placedCount / data.items.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="sort-stage">
            <div
              className="sort-card"
              data-dragging={drag ? 'true' : 'false'}
              style={
                drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined
              }
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {current.text}
            </div>
          </div>

          <p className="hint sort-hint">
            בחרו את הרשות המתאימה, או גררו את הכרטיס אליה.
          </p>

          <div className="bucket-list">
            {data.buckets.map((bucket) => {
              const count = data.items.filter((it) => placements[it.id] === bucket.id).length;
              return (
                <button
                  key={bucket.id}
                  className="bucket-btn"
                  data-bucket={bucket.id}
                  data-over={overBucket === bucket.id}
                  onClick={() => place(current.id, bucket.id)}
                >
                  <span className="bucket-btn-label">{bucket.label}</span>
                  <span className="bucket-count">{count}</span>
                </button>
              );
            })}
          </div>

          {placedCount > 0 && (
            <button
              className="btn btn-link sort-undo"
              onClick={() => {
                const lastPlaced = data.items
                  .filter((it) => placements[it.id] && !locked.has(it.id))
                  .pop();
                if (lastPlaced) returnToDeck(lastPlaced.id);
              }}
            >
              ביטול המיון האחרון
            </button>
          )}
        </>
      )}

      {(inReview || solved) && (
        <div className="review-grid">
          {data.buckets.map((bucket) => {
            const items = data.items.filter((it) => placements[it.id] === bucket.id);
            return (
              <div className="review-bucket" key={bucket.id}>
                <h3 className="bucket-title">
                  <span style={{ flex: 1 }}>{bucket.label}</span>
                  <span className="bucket-count">{items.length}</span>
                </h3>
                <div className="bucket-items">
                  {items.map((item) => {
                    const verdict = solved || locked.has(item.id)
                      ? 'correct'
                      : checked && wrong.has(item.id)
                        ? 'wrong'
                        : undefined;
                    return (
                      <button
                        key={item.id}
                        className="chip"
                        data-verdict={verdict}
                        onClick={() => returnToDeck(item.id)}
                        disabled={locked.has(item.id) || solved}
                      >
                        {item.text}
                      </button>
                    );
                  })}
                  {items.length === 0 && <p className="review-empty">אין היגדים</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {solved ? (
        <FeedbackPanel verdict="correct" message={FEEDBACK.correct} />
      ) : checked && wrong.size > 0 ? (
        <>
          <FeedbackPanel
            verdict="wrong"
            message={`${FEEDBACK.incorrect} ${wrong.size} היגדים אינם ברשות הנכונה.`}
            onOpenConstitution={() => setShowModal(true)}
          />
          <button className="btn btn-ghost btn-block" onClick={clearWrong}>
            החזרת ההיגדים השגויים ותיקון
          </button>
        </>
      ) : (
        inReview && (
          <button className="btn btn-primary btn-block" onClick={check}>
            בדיקת המיון
          </button>
        )
      )}

      {showModal && (
        <ConstitutionModal excerpt={data.constitutionExcerpt} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
