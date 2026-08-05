'use client';

import { UNITS } from '@/content/module';
import { UnitIcon } from './UnitIcon';

export function Progress({
  unitIndex,
  slideIndex,
  isUnitUnlocked,
  onJumpToUnit,
}: {
  unitIndex: number;
  slideIndex: number;
  isUnitUnlocked: (i: number) => boolean;
  onJumpToUnit: (i: number) => void;
}) {
  const unit = UNITS[unitIndex];
  const withinPct = ((slideIndex + 1) / unit.slides.length) * 100;
  const overallPct = ((unitIndex + (slideIndex + 1) / unit.slides.length) / UNITS.length) * 100;

  return (
    <div className="progress-wrap no-print">
      <nav className="unit-stepper" aria-label="פרקי הלומדה">
        {UNITS.map((u, i) => {
          const state = i === unitIndex ? 'current' : isUnitUnlocked(i) ? 'done' : 'locked';
          return (
            <button
              key={u.id}
              className="step"
              data-state={state}
              disabled={!isUnitUnlocked(i) || i === unitIndex}
              onClick={() => onJumpToUnit(i)}
              aria-current={i === unitIndex ? 'step' : undefined}
              title={u.title}
            >
              <UnitIcon name={u.icon} />
              <span>יחידה {u.number}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="bar"
        role="progressbar"
        aria-valuenow={Math.round(overallPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="התקדמות כללית בלומדה"
      >
        <div className="bar-fill" style={{ width: `${overallPct}%` }} />
      </div>
      <div className="bar-label">
        <span>
          {unit.title} · שקף {slideIndex + 1} מתוך {unit.slides.length}
        </span>
        <span>{Math.round(withinPct)}% ביחידה</span>
      </div>
    </div>
  );
}
