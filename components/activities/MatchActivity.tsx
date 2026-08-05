'use client';

import { useMemo, useState } from 'react';
import { FEEDBACK, MatchActivity as MatchActivityData } from '@/content/module';
import { ConstitutionModal } from '../ConstitutionModal';
import { FeedbackPanel } from '../Feedback';

export function MatchActivity({
  data,
  done,
  onComplete,
}: {
  data: MatchActivityData;
  done: boolean;
  onComplete: () => void;
}) {
  /** All available responses, offered as choices under every need. */
  const responses = useMemo(
    () => data.pairs.map((p) => ({ pairId: p.id, text: p.response })),
    [data.pairs],
  );

  const [choices, setChoices] = useState<Record<string, string>>({});
  const [matched, setMatched] = useState<Set<string>>(
    () => new Set(done ? data.pairs.map((p) => p.id) : []),
  );
  const [showModal, setShowModal] = useState(false);

  function pick(needPairId: string, responsePairId: string) {
    if (matched.has(needPairId)) return;
    setChoices((c) => ({ ...c, [needPairId]: responsePairId }));
    if (needPairId === responsePairId) {
      const next = new Set(matched);
      next.add(needPairId);
      setMatched(next);
      if (next.size === data.pairs.length) onComplete();
    }
  }

  const anyWrong = data.pairs.some(
    (p) => choices[p.id] && choices[p.id] !== p.id && !matched.has(p.id),
  );

  return (
    <>
      <p className="eyebrow">פעילות יישום</p>
      <h2 className="section-heading">{data.heading}</h2>
      <p className="body-p">{data.instruction}</p>

      <div className="match-grid">
        {data.pairs.map((pair) => {
          const chosen = choices[pair.id];
          const isMatched = matched.has(pair.id);
          return (
            <div className="need-card" key={pair.id}>
              <p className="eyebrow" style={{ color: 'var(--olive)' }}>
                הצורך
              </p>
              <p className="need-quote">&quot;{pair.need}&quot;</p>
              <p className="eyebrow" style={{ color: 'var(--olive)' }}>
                ההתאמה
              </p>
              <div className="options">
                {responses.map((response) => {
                  let verdict: 'correct' | 'wrong' | undefined;
                  if (isMatched) {
                    verdict = response.pairId === pair.id ? 'correct' : undefined;
                  } else if (chosen === response.pairId) {
                    verdict = 'wrong';
                  }
                  return (
                    <button
                      key={response.pairId}
                      className="option"
                      data-verdict={verdict}
                      onClick={() => pick(pair.id, response.pairId)}
                      disabled={isMatched}
                    >
                      <span>{response.text}</span>
                    </button>
                  );
                })}
              </div>
              {isMatched && <FeedbackPanel verdict="correct" message={FEEDBACK.correct} />}
              {!isMatched && chosen && (
                <FeedbackPanel
                  verdict="wrong"
                  message={FEEDBACK.incorrect}
                  onOpenConstitution={() => setShowModal(true)}
                />
              )}
            </div>
          );
        })}
      </div>

      {matched.size === data.pairs.length && !anyWrong && (
        <p className="hint" style={{ color: 'var(--olive)', marginTop: 16 }}>
          כל ההתאמות נכונות — אפשר להמשיך.
        </p>
      )}

      {showModal && (
        <ConstitutionModal excerpt={data.constitutionExcerpt} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
