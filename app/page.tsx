'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  COMPLETION,
  DECLARATION,
  OPENING,
  SUMMARY_LINE,
  Slide,
  UNITS,
} from '@/content/module';
import { REVIEW_MODE, SHOW_CERTIFICATE } from '@/lib/config';
import {
  EMPTY_PROGRESS,
  StoredProgress,
  clearProgress,
  loadProgress,
  saveProgress,
} from '@/lib/progress';
import { Blocks, Highlighted } from '@/components/RichText';
import { Progress } from '@/components/Progress';
import { UnitIcon } from '@/components/UnitIcon';
import { Confetti } from '@/components/Confetti';
import { Certificate } from '@/components/Certificate';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { SortActivity } from '@/components/activities/SortActivity';
import { QuizActivity } from '@/components/activities/QuizActivity';
import { MatchActivity } from '@/components/activities/MatchActivity';
import { BoardActivity } from '@/components/activities/BoardActivity';

type Screen =
  | { kind: 'opening' }
  | { kind: 'resume' }
  | { kind: 'slide'; unitIndex: number; slideIndex: number }
  | { kind: 'summary' }
  | { kind: 'declaration' }
  | { kind: 'completion' };

/** Ids of every activity slide — all must be completed to pass. */
const ACTIVITY_IDS = UNITS.flatMap((u) =>
  u.slides.filter((s) => s.kind !== 'knowledge').map((s) => s.id),
);

const PHOTOS = [
  { src: '/photos/school-sorting.jpg', alt: 'ילדים בפעילות משותפת בבית הספר' },
  { src: '/photos/school-soccer.jpg', alt: 'משחק כדורגל בחצר בית הספר' },
  { src: '/photos/school-laptops.jpg', alt: 'למידה משותפת במרחבי בית הספר' },
];

export default function Page() {
  const [screen, setScreen] = useState<Screen>({ kind: 'opening' });
  const [progress, setProgress] = useState<StoredProgress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<Date>(() => new Date());

  /* Restore prior progress on first load. */
  useEffect(() => {
    const stored = loadProgress();
    if (stored) {
      setProgress(stored);
      setName(stored.name);
      setPhone(stored.phone);
      const hasStarted = stored.unitReached > 0 || stored.done.length > 0;
      if (stored.declared && stored.completedAt) {
        setCompletedAt(new Date(stored.completedAt));
        setScreen({ kind: 'completion' });
      } else if (hasStarted) {
        setScreen({ kind: 'resume' });
      }
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: StoredProgress) => {
    setProgress(next);
    saveProgress(next);
  }, []);

  const allActivitiesDone =
    useMemo(
      () => ACTIVITY_IDS.every((id) => progress.done.includes(id)),
      [progress.done],
    ) || REVIEW_MODE;

  const isUnitComplete = useCallback(
    (unitIndex: number) =>
      UNITS[unitIndex].slides
        .filter((s) => s.kind !== 'knowledge')
        .every((s) => progress.done.includes(s.id)),
    [progress.done],
  );

  /** A unit is reachable once the learner has got that far. */
  const isUnitUnlocked = useCallback(
    (unitIndex: number) => unitIndex + 1 <= Math.max(progress.unitReached, 1),
    [progress.unitReached],
  );

  const markActivityDone = useCallback(
    (slideId: string) => {
      setProgress((prev) => {
        if (prev.done.includes(slideId)) return prev;
        const next = { ...prev, done: [...prev.done, slideId] };
        saveProgress(next);
        return next;
      });
    },
    [],
  );

  const goToSlide = useCallback(
    (unitIndex: number, slideIndex: number) => {
      setScreen({ kind: 'slide', unitIndex, slideIndex });
      setProgress((prev) => {
        const unitReached = Math.max(prev.unitReached, unitIndex + 1);
        if (unitReached === prev.unitReached) return prev;
        const next = { ...prev, unitReached };
        saveProgress(next);
        return next;
      });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [],
  );

  function goNext() {
    if (screen.kind !== 'slide') return;
    const { unitIndex, slideIndex } = screen;
    if (slideIndex + 1 < UNITS[unitIndex].slides.length) {
      goToSlide(unitIndex, slideIndex + 1);
    } else if (unitIndex + 1 < UNITS.length) {
      goToSlide(unitIndex + 1, 0);
    } else {
      setScreen({ kind: 'summary' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goBack() {
    if (screen.kind === 'summary') {
      const lastUnit = UNITS.length - 1;
      goToSlide(lastUnit, UNITS[lastUnit].slides.length - 1);
      return;
    }
    if (screen.kind === 'declaration') {
      setScreen({ kind: 'summary' });
      return;
    }
    if (screen.kind !== 'slide') return;
    const { unitIndex, slideIndex } = screen;
    if (slideIndex > 0) goToSlide(unitIndex, slideIndex - 1);
    else if (unitIndex > 0)
      goToSlide(unitIndex - 1, UNITS[unitIndex - 1].slides.length - 1);
    else setScreen({ kind: 'opening' });
  }

  async function confirmDeclaration() {
    if (!name.trim() || !agreed || !allActivitiesDone) return;
    setSubmitting(true);
    setSubmitError(null);
    const finishedAt = new Date();
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      /* Never trap the learner behind a network failure — the teacher is told
         the row may be missing, and completion still proceeds. */
      setSubmitError(
        'ההצהרה נשמרה במכשיר שלכם, אך ייתכן שהרישום במערכת בית הספר לא הושלם. אנא עדכנו את צוות בית הספר.',
      );
    }
    setCompletedAt(finishedAt);
    persist({
      ...progress,
      declared: true,
      name: name.trim(),
      phone: phone.trim(),
      completedAt: finishedAt.toISOString(),
    });
    setSubmitting(false);
    setScreen({ kind: 'completion' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function restart() {
    clearProgress();
    setProgress(EMPTY_PROGRESS);
    setName('');
    setPhone('');
    setAgreed(false);
    setSubmitError(null);
    setScreen({ kind: 'opening' });
  }

  /* Avoid a flash of the opening screen before localStorage is read. */
  if (!hydrated) return <div className="app" />;

  /* ---------- opening ---------- */
  if (screen.kind === 'opening') {
    return (
      <div className="app">
        <main className="shell">
          <div className="card">
            <p className="eyebrow">לומדה אינטראקטיבית</p>
            <h1 className="screen-title">{OPENING.title}</h1>
            <p className="subtitle">{OPENING.subtitle}</p>
            <div className="photo-strip">
              {PHOTOS.map((p) => (
                <figure className="photo" key={p.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} />
                </figure>
              ))}
            </div>
            <Blocks blocks={OPENING.blocks} />
            <div className="nav-row" style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={() => goToSlide(0, 0)}>
                {OPENING.startButton}
              </button>
              <Link href="/constitution" className="btn-link">
                לקריאת חוקת בית הספר במלואה ←
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- returning learner, not yet finished ---------- */
  if (screen.kind === 'resume') {
    const lastUnitIndex = Math.max(0, Math.min(progress.unitReached - 1, UNITS.length - 1));
    return (
      <div className="app">
        <main className="shell">
          <div className="card">
            <p className="eyebrow">הלומדה טרם הושלמה</p>
            <h1 className="screen-title">עדיין לא סיימתם את הלומדה</h1>
            <p className="body-p">
              התקדמתם עד {UNITS[lastUnitIndex].title}, אך עדיין לא השלמתם את כל היחידות ואת כל
              פעילויות היישום. אפשר להמשיך מהמקום שבו עצרתם, או להתחיל מחדש מההתחלה.
            </p>
            <ul className="body-list">
              {UNITS.map((u, i) => (
                <li key={u.id}>
                  {u.title} — {isUnitComplete(i) ? 'הושלמה' : 'טרם הושלמה'}
                </li>
              ))}
            </ul>
            <div className="nav-row">
              <button className="btn btn-ghost" onClick={restart}>
                התחלה מחדש
              </button>
              <button
                className="btn btn-primary"
                onClick={() => goToSlide(lastUnitIndex, 0)}
              >
                המשך מ{UNITS[lastUnitIndex].title} ←
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- summary + gate into the declaration ---------- */
  if (screen.kind === 'summary') {
    return (
      <div className="app">
        <main className="shell">
          <div className="card">
            <p className="eyebrow">סיכום</p>
            <p className="body-p" style={{ fontSize: 17, lineHeight: 1.9 }}>
              <Highlighted text={SUMMARY_LINE} />
            </p>

            {!allActivitiesDone && (
              <>
                <p className="body-p" style={{ color: 'var(--danger)' }}>
                  כדי לסיים את הלומדה יש להשלים את כל פעילויות היישום:
                </p>
                <ul className="body-list">
                  {UNITS.filter((_, i) => !isUnitComplete(i)).map((u) => (
                    <li key={u.id}>{u.title}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="nav-row nav-sticky">
              <button className="btn btn-ghost" onClick={goBack}>
                → חזרה
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setScreen({ kind: 'declaration' })}
                disabled={!allActivitiesDone}
              >
                למסך ההצהרה ←
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- declaration ---------- */
  if (screen.kind === 'declaration') {
    return (
      <div className="app">
        <main className="shell">
          <div className="card">
            <p className="eyebrow">שלב אחרון</p>
            <h1 className="screen-title">{DECLARATION.screenTitle}</h1>

            <div className="field">
              <label className="field-label" htmlFor="decl-name">
                {DECLARATION.nameFieldLabel}
              </label>
              <input
                id="decl-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="decl-phone">
                {DECLARATION.phoneFieldLabel}
              </label>
              <input
                id="decl-phone"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="declaration-text">{DECLARATION.text}</div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>{DECLARATION.checkboxLabel}</span>
            </label>

            {!name.trim() && <p className="hint">יש להזין שם כדי לאשר את ההצהרה.</p>}

            <div className="nav-row nav-sticky">
              <button className="btn btn-ghost" onClick={goBack}>
                → חזרה
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmDeclaration}
                disabled={!name.trim() || !agreed || submitting || !allActivitiesDone}
              >
                {submitting ? 'שומרים...' : DECLARATION.confirmButton}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- completion ---------- */
  if (screen.kind === 'completion') {
    return (
      <div className="app">
        <Confetti />
        <main className="shell">
          <div className="card">
            <p className="eyebrow">סיימתם!</p>
            <h1 className="screen-title">{COMPLETION.title}</h1>

            <div className="photo-strip">
              {PHOTOS.map((p) => (
                <figure className="photo" key={p.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.alt} />
                </figure>
              ))}
            </div>

            <Blocks blocks={COMPLETION.blocks} />

            {submitError && <p className="error-text">{submitError}</p>}

            {SHOW_CERTIFICATE && (
              <>
                <Certificate name={progress.name || name} date={completedAt} />
                <div className="nav-row no-print">
                  <WhatsAppShare name={progress.name || name} date={completedAt} />
                  <button className="btn btn-ghost" onClick={restart}>
                    מעבר על הלומדה מחדש
                  </button>
                </div>
              </>
            )}

            {!SHOW_CERTIFICATE && (
              <div className="nav-row no-print">
                <WhatsAppShare name={progress.name || name} date={completedAt} />
                <button className="btn btn-ghost" onClick={restart}>
                  מעבר על הלומדה מחדש
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ---------- unit slides ---------- */
  const { unitIndex, slideIndex } = screen;
  const unit = UNITS[unitIndex];
  const slide: Slide = unit.slides[slideIndex];
  const activityDone = slide.kind === 'knowledge' || progress.done.includes(slide.id);
  /** REVIEW_MODE only unblocks navigation — activities still render as
      actually-incomplete, so they stay interactive to try out. */
  const canAdvance = activityDone || REVIEW_MODE;
  const isVeryFirst = unitIndex === 0 && slideIndex === 0;

  return (
    <div className="app">
      <Progress
        unitIndex={unitIndex}
        slideIndex={slideIndex}
        isUnitUnlocked={isUnitUnlocked}
        onJumpToUnit={(i) => goToSlide(i, 0)}
      />
      <main className="shell">
        <div className="card">
          {slide.kind === 'knowledge' ? (
            <>
              <p className="eyebrow">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    verticalAlign: 'middle',
                  }}
                >
                  <UnitIcon
                    name={unit.icon}
                    className="step-icon"
                  />
                  הקניית ידע
                </span>
              </p>
              <h1 className="section-heading">{unit.title}</h1>
              {slideIndex === 0 && unit.photos.length > 0 && (
                <div className="unit-gallery" aria-label={`תמונות מהיחידה: ${unit.title}`}>
                  {unit.photos.map((photo) => (
                    <figure className="unit-gallery-item" key={photo.src}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.src} alt={photo.alt} loading="lazy" />
                    </figure>
                  ))}
                </div>
              )}
              <Blocks blocks={slide.blocks} />
            </>
          ) : slide.kind === 'sort' ? (
            <SortActivity
              data={slide}
              done={activityDone}
              onComplete={() => markActivityDone(slide.id)}
            />
          ) : slide.kind === 'quiz' ? (
            <QuizActivity
              data={slide}
              done={activityDone}
              onComplete={() => markActivityDone(slide.id)}
            />
          ) : slide.kind === 'match' ? (
            <MatchActivity
              data={slide}
              done={activityDone}
              onComplete={() => markActivityDone(slide.id)}
            />
          ) : (
            <BoardActivity
              data={slide}
              done={activityDone}
              onComplete={() => markActivityDone(slide.id)}
            />
          )}

          {/* Above the nav, not below it — on a phone the nav sticks to the
              bottom of the screen and would hide anything after it. */}
          {!activityDone && !REVIEW_MODE && (
            <p className="hint">יש להשלים את הפעילות כדי להמשיך ליחידה הבאה.</p>
          )}
          {!activityDone && REVIEW_MODE && (
            <p className="hint" style={{ color: 'var(--terracotta)' }}>
              מצב סקירה: אפשר להמשיך בלי להשלים את הפעילות.
            </p>
          )}

          <div className="nav-row nav-sticky no-print">
            <button className="btn btn-ghost" onClick={goBack}>
              {isVeryFirst ? '→ למסך הפתיחה' : '→ אחורה'}
            </button>
            <button className="btn btn-primary" onClick={goNext} disabled={!canAdvance}>
              {slideIndex + 1 === unit.slides.length && unitIndex + 1 === UNITS.length
                ? 'לסיכום ←'
                : 'הבא ←'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
