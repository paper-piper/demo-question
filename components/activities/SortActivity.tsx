'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FEEDBACK, SortActivity as SortActivityData } from '@/content/module';
import { ConstitutionModal } from '../ConstitutionModal';
import { FeedbackPanel } from '../Feedback';
import { Highlighted } from '../RichText';

type Placements = Record<string, string | undefined>;

/** A drop target: a bucket id, or the tray the chips came from. */
const TRAY = '__tray__';

/** How far a pointer may wander before a press stops counting as a tap. */
const TAP_SLOP = 10;
/** Hold this long before a touch becomes a drag, so a swipe can still scroll. */
const TOUCH_HOLD_MS = 170;
/** Distance from the viewport edge that starts auto-scrolling mid-drag. */
const EDGE_ZONE = 96;
const EDGE_SPEED = 16;

interface Press {
  itemId: string;
  text: string;
  pointerId: number;
  isTouch: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
  /** Offset from the chip's centre, so the ghost keeps its grab point. */
  dx: number;
  dy: number;
  dragging: boolean;
  holdTimer: number | null;
}

/** Bucket labels carry a parenthetical gloss that is too long for a dock button. */
function shortLabel(label: string) {
  return label.replace(/\s*\([^)]*\)\s*/g, ' ').trim() || label;
}

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
  const [showModal, setShowModal] = useState(false);

  /** The chip currently being dragged, and the target under the pointer. */
  const [dragItem, setDragItem] = useState<{ id: string; text: string } | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null);

  const bucketEls = useRef(new Map<string, HTMLDivElement | null>());
  const trayEl = useRef<HTMLDivElement | null>(null);
  const ghostEl = useRef<HTMLDivElement | null>(null);
  const press = useRef<Press | null>(null);
  const frame = useRef<number | null>(null);
  /** Set when a drag ends, so the click that follows pointerup is ignored. */
  const swallowClick = useRef(false);
  /** Latest teardown for an in-flight press, so unmount can't leak listeners. */
  const teardown = useRef<(() => void) | null>(null);

  const solved = done || locked.size === data.items.length;

  const tray = useMemo(
    () => data.items.filter((it) => !placements[it.id]),
    [data.items, placements],
  );

  const allPlaced = tray.length === 0;
  const selectedItem = data.items.find((it) => it.id === selected);

  const place = useCallback(
    (itemId: string, bucketId: string) => {
      setPlacements((p) => {
        if (locked.has(itemId) || solved || p[itemId] === bucketId) return p;
        return { ...p, [itemId]: bucketId };
      });
      setSelected(null);
      setChecked(false);
      setWrong((w) => {
        if (!w.has(itemId)) return w;
        const next = new Set(w);
        next.delete(itemId);
        return next;
      });
    },
    [locked, solved],
  );

  const returnToTray = useCallback(
    (itemId: string) => {
      if (locked.has(itemId) || solved) return;
      setPlacements((p) => {
        if (!p[itemId]) return p;
        const next = { ...p };
        delete next[itemId];
        return next;
      });
      setSelected(null);
      setChecked(false);
    },
    [locked, solved],
  );

  /* ---------- pointer dragging (mouse, pen and touch alike) ----------
     The native HTML5 drag-and-drop API this used to rely on never fires on
     touch devices, so on a phone the chips simply could not be dragged.
     Pointer events cover every input type. */

  const hitTest = useCallback((x: number, y: number): string | null => {
    for (const [id, el] of bucketEls.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
    }
    const t = trayEl.current?.getBoundingClientRect();
    if (t && x >= t.left && x <= t.right && y >= t.top && y <= t.bottom) return TRAY;
    return null;
  }, []);

  /** One frame of the drag: auto-scroll, hit-test, move the ghost. */
  const tick = useCallback(() => {
    const p = press.current;
    if (!p || !p.dragging) {
      frame.current = null;
      return;
    }

    /* Auto-scroll when the finger nears an edge — the whole point is that the
       learner never has to let go and scroll to reach a bucket. */
    const h = window.innerHeight;
    if (p.y < EDGE_ZONE) {
      window.scrollBy(0, -Math.ceil(EDGE_SPEED * (1 - p.y / EDGE_ZONE)));
    } else if (p.y > h - EDGE_ZONE) {
      window.scrollBy(0, Math.ceil(EDGE_SPEED * (1 - (h - p.y) / EDGE_ZONE)));
    }

    setOverTarget(hitTest(p.x, p.y));

    if (ghostEl.current) {
      ghostEl.current.style.transform =
        `translate3d(${p.x + p.dx}px, ${p.y + p.dy}px, 0) translate(-50%, -50%) rotate(-2deg)`;
      ghostEl.current.style.opacity = '1';
    }

    frame.current = requestAnimationFrame(tick);
  }, [hitTest]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, itemId: string, text: string) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (solved || locked.has(itemId)) return;
      /* The click from any previous gesture has already been dispatched. */
      swallowClick.current = false;

      const rect = e.currentTarget.getBoundingClientRect();
      const p: Press = {
        itemId,
        text,
        pointerId: e.pointerId,
        isTouch: e.pointerType !== 'mouse',
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        dx: rect.left + rect.width / 2 - e.clientX,
        dy: rect.top + rect.height / 2 - e.clientY,
        dragging: false,
        holdTimer: null,
      };
      press.current = p;

      /* Touch scrolling has to keep working right up to the moment a drag
         actually begins, so block it only from then on — and via a
         non-passive listener, the only kind that can. */
      const blockScroll = (ev: TouchEvent) => ev.preventDefault();

      const begin = () => {
        if (!press.current || press.current.dragging) return;
        press.current.dragging = true;
        document.addEventListener('touchmove', blockScroll, { passive: false });
        document.body.classList.add('is-dragging');
        setSelected(null);
        setDragItem({ id: itemId, text });
        (navigator as Navigator & { vibrate?: (ms: number) => boolean }).vibrate?.(8);
        if (frame.current === null) frame.current = requestAnimationFrame(tick);
      };

      const finish = () => {
        if (p.holdTimer !== null) window.clearTimeout(p.holdTimer);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onCancel);
        document.removeEventListener('touchmove', blockScroll);
        document.body.classList.remove('is-dragging');
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
          frame.current = null;
        }
        press.current = null;
        teardown.current = null;
        setDragItem(null);
        setOverTarget(null);
      };

      function onMove(ev: PointerEvent) {
        const cur = press.current;
        if (!cur || ev.pointerId !== cur.pointerId) return;
        cur.x = ev.clientX;
        cur.y = ev.clientY;
        if (cur.dragging) return;

        const far = Math.hypot(ev.clientX - cur.startX, ev.clientY - cur.startY) > TAP_SLOP;
        if (!far) return;
        /* Moving before the hold elapsed means the finger is scrolling the
           page, not picking a chip up. A mouse has no such ambiguity. */
        if (cur.isTouch) finish();
        else begin();
      }

      function onUp(ev: PointerEvent) {
        const cur = press.current;
        if (!cur || ev.pointerId !== cur.pointerId) return;
        const wasDragging = cur.dragging;
        const target = wasDragging ? hitTest(cur.x, cur.y) : null;
        finish();
        if (!wasDragging) return;
        /* A drag is always followed by a click event; suppress it so the drop
           isn't immediately undone by the chip's tap handler. */
        swallowClick.current = true;
        window.setTimeout(() => {
          swallowClick.current = false;
        }, 350);
        if (target === TRAY) returnToTray(itemId);
        else if (target) place(itemId, target);
      }

      function onCancel(ev: PointerEvent) {
        if (press.current && ev.pointerId !== press.current.pointerId) return;
        finish();
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onCancel);
      teardown.current = finish;

      if (p.isTouch) p.holdTimer = window.setTimeout(begin, TOUCH_HOLD_MS);
    },
    [hitTest, locked, place, returnToTray, solved, tick],
  );

  /* Never leave document listeners or a frozen page behind. */
  useEffect(() => () => teardown.current?.(), []);

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
          <div className="chip-tray" data-over={overTarget === TRAY} ref={trayEl} aria-label="היגדים למיון">
            {tray.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>
                כל ההיגדים מוינו. אפשר לבדוק.
              </p>
            ) : (
              tray.map((item) => (
                <button
                  key={item.id}
                  className="chip"
                  data-selected={selected === item.id}
                  data-dragging={dragItem?.id === item.id}
                  onPointerDown={(e) => onPointerDown(e, item.id, item.text)}
                  onClick={() => {
                    if (swallowClick.current) return;
                    setSelected(selected === item.id ? null : item.id);
                  }}
                  aria-pressed={selected === item.id}
                >
                  {item.text}
                </button>
              ))
            )}
          </div>
          <p className="hint">
            הקישו על היגד ובחרו את הרשות מתוך הסרגל שייפתח בתחתית המסך — או גררו אותו אל
            הרשות (במסך מגע: לחיצה ארוכה ואז גרירה).
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
              data-over={overTarget === bucket.id}
              data-target={!!(dragItem || selected)}
              ref={(el) => {
                bucketEls.current.set(bucket.id, el);
              }}
              onClick={() => {
                if (swallowClick.current) return;
                if (selected) place(selected, bucket.id);
              }}
            >
              <h3 className="bucket-title">
                <Highlighted text={bucket.label} />
                <span className="bucket-count">({items.length})</span>
              </h3>
              <div className="bucket-items">
                {items.length === 0 && (dragItem || selected) && (
                  <p className="bucket-placeholder">שחררו כאן</p>
                )}
                {items.map((item) => (
                  <button
                    key={item.id}
                    className="chip"
                    data-verdict={verdictFor(item.id)}
                    data-dragging={dragItem?.id === item.id}
                    onPointerDown={(e) => onPointerDown(e, item.id, item.text)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (swallowClick.current) return;
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

      {/* The chip that follows the finger. Rendered outside every scroll
          container so it can never be clipped mid-drag. */}
      {dragItem && (
        <div className="drag-layer" aria-hidden="true">
          <div className="chip chip-ghost" ref={ghostEl}>
            {dragItem.text}
          </div>
        </div>
      )}

      {/* Tapping a chip opens this dock, so a card can be placed without
          scrolling down to hunt for its bucket. */}
      {selectedItem && !solved && (
        <div className="sort-dock" role="group" aria-label="בחירת רשות עבור ההיגד">
          <p className="sort-dock-item">
            <span className="sort-dock-eyebrow">ההיגד שבחרתם</span>
            {selectedItem.text}
          </p>
          <div className="sort-dock-actions">
            {data.buckets.map((bucket) => (
              <button
                key={bucket.id}
                className="sort-dock-btn"
                onClick={() => place(selectedItem.id, bucket.id)}
                title={bucket.label}
              >
                {shortLabel(bucket.label)}
              </button>
            ))}
          </div>
          <button className="sort-dock-cancel" onClick={() => setSelected(null)}>
            ביטול הבחירה
          </button>
        </div>
      )}

      {showModal && (
        <ConstitutionModal excerpt={data.constitutionExcerpt} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
