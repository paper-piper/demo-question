import { STORAGE_KEY } from './config';

export interface StoredProgress {
  /** Activity slide ids the learner has completed. */
  done: string[];
  /** Highest unit number reached (1-4), 0 before starting. */
  unitReached: number;
  /** Declaration confirmed. */
  declared: boolean;
  name: string;
  phone: string;
  /** ISO date of completion, if finished. */
  completedAt?: string;
}

export const EMPTY_PROGRESS: StoredProgress = {
  done: [],
  unitReached: 0,
  declared: false,
  name: '',
  phone: '',
};

export function loadProgress(): StoredProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      done: Array.isArray(parsed.done) ? parsed.done : [],
    };
  } catch {
    return null;
  }
}

export function saveProgress(progress: StoredProgress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* private browsing / quota — the module still works for this session */
  }
}

export function clearProgress() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
