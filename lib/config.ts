/**
 * Feature flags.
 *
 * SHOW_CERTIFICATE — the teacher's notes present the certificate as optional
 * ("האם רוצים לייצר תעודה או שעדיף לוותר על זה?"). It is built and on by
 * default; flip to false to remove it from the completion screen entirely.
 */
export const SHOW_CERTIFICATE = true;

/**
 * TEMPORARY — REMOVE BEFORE PRODUCTION.
 * Lets "הבא" advance past an activity slide without completing it, so the
 * whole module can be reviewed quickly. Also skips the "complete every
 * activity" gate before the declaration screen.
 */
export const REVIEW_MODE = false;

/** Human-readable module name, used on the certificate. */
export const MODULE_NAME = 'דמוקרטי לב השרון מהלכה למעשה';

/** localStorage key for resume/progress state. */
export const STORAGE_KEY = 'dls-module-progress-v1';
