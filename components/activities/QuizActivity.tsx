'use client';

import { useState } from 'react';
import { FEEDBACK, QuizActivity as QuizActivityData } from '@/content/module';
import { ConstitutionModal } from '../ConstitutionModal';
import { FeedbackPanel } from '../Feedback';
import { Highlighted } from '../RichText';

export function QuizActivity({
  data,
  done,
  onComplete,
}: {
  data: QuizActivityData;
  done: boolean;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(
    () => new Set(done ? data.questions.map((q) => q.id) : []),
  );
  const [showModal, setShowModal] = useState(false);

  const question = data.questions[index];
  const isCorrect = choice !== null && choice === question.correctOptionId;
  const alreadyDone = answered.has(question.id);
  const isLast = index === data.questions.length - 1;

  function pick(optionId: string) {
    if (choice !== null && isCorrect) return;
    setChoice(optionId);
    if (optionId === question.correctOptionId) {
      const next = new Set(answered);
      next.add(question.id);
      setAnswered(next);
      if (next.size === data.questions.length) onComplete();
    }
  }

  function goTo(i: number) {
    setIndex(i);
    setChoice(null);
    setShowModal(false);
  }

  function verdictFor(optionId: string): 'correct' | 'wrong' | undefined {
    if (alreadyDone && choice === null) {
      return optionId === question.correctOptionId ? 'correct' : undefined;
    }
    if (choice === null) return undefined;
    if (optionId === choice) return isCorrect ? 'correct' : 'wrong';
    if (isCorrect && optionId === question.correctOptionId) return 'correct';
    return undefined;
  }

  const locked = isCorrect || (alreadyDone && choice === null);

  return (
    <>
      <p className="eyebrow">פעילות יישום</p>
      <h2 className="section-heading">{data.heading}</h2>
      <p className="body-p">{data.instruction}</p>

      <p className="q-counter">
        שאלה {index + 1} מתוך {data.questions.length}
      </p>

      <div className="scenario">
        <Highlighted text={question.scenario} />
      </div>

      <div className="options">
        {question.options.map((option) => (
          <button
            key={option.id}
            className="option"
            data-verdict={verdictFor(option.id)}
            onClick={() => pick(option.id)}
            disabled={locked}
          >
            <span className="option-label">{option.label}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>

      {choice !== null &&
        (isCorrect ? (
          <FeedbackPanel verdict="correct" message={FEEDBACK.correct} />
        ) : (
          <FeedbackPanel
            verdict="wrong"
            message={FEEDBACK.incorrect}
            onOpenConstitution={() => setShowModal(true)}
          />
        ))}

      {alreadyDone && choice === null && (
        <FeedbackPanel verdict="correct" message={FEEDBACK.correct} />
      )}

      <div className="nav-row">
        <button className="btn btn-ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
          ← השאלה הקודמת
        </button>
        {!isLast ? (
          <button
            className="btn btn-secondary"
            onClick={() => goTo(index + 1)}
            disabled={!answered.has(question.id)}
          >
            לשאלה הבאה →
          </button>
        ) : (
          answered.size === data.questions.length && (
            <span className="hint" style={{ margin: 0, color: 'var(--olive)' }}>
              סיימתם את כל השאלות — אפשר להמשיך.
            </span>
          )
        )}
      </div>

      {showModal && (
        <ConstitutionModal
          excerpt={question.constitutionExcerpt}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
