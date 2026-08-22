/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by scripts/sync-questions.mjs from the "Questions" tab of the
 * Google Sheet (GOOGLE_SHEETS_SPREADSHEET_ID). Runs automatically before
 * every build (see package.json "prebuild"). Edit questions by editing the
 * sheet and triggering a rebuild at /admin/rebuild — not by editing this file.
 *
 * This checked-in copy is the fallback used when Sheets env vars aren't set
 * (e.g. local dev) or the sheet has no "Questions" tab yet.
 */

import type { QuizQuestion } from './module';
import { EXCERPT_CHOICE_FREEDOM } from './constitution';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'u2-q1',
    scenario:
      'תרחיש 1: "שכרון החופש" - תלמיד חדש שהגיע מבית ספר רגיל החליט שבחודש הראשון הוא לא נרשם לאף קורס ומעביר את כל היום במגרש הכדורגל ובמרחבי בית הספר.',
    options: [
      {
        id: 'a',
        label: 'א.',
        text: 'יש לחייב אותו לבחור לפחות במקצועות ליבה כדי שלא "ילך לאיבוד" ויצבור פערים.',
      },
      {
        id: 'b',
        label: 'ב.',
        text: 'זהו מצב טבעי המכונה "שכרון חופש". הצוות ילווה אותו בסבלנות עד שילמד לנהל את החופש שלו ויבחר בעשייה ולמידה מתוך מוטיבציה פנימית עמוקה.',
      },
      { id: 'c', label: 'ג.', text: 'מצב זה מעיד על חוסר התאמה למסגרת הדמוקרטית.' },
    ],
    correctOptionId: 'b',
    constitutionExcerpt: EXCERPT_CHOICE_FREEDOM,
  },
  {
    id: 'u2-q2',
    scenario:
      'תרחיש 2: המעבר מרצון למחויבות - תלמידה בחרה בקורס אנגלית בתחילת השנה, אך לאחר חודשיים היא החלה "להבריז" ממנו באופן קבוע כי הקורס הפך למאתגר מדי עבורה.',
    options: [
      { id: 'a', label: 'א.', text: 'זכותה המלאה לא להגיע, הבחירה היא יומיומית ודינמית.' },
      {
        id: 'b',
        label: 'ב.',
        text: 'הבחירה כרוכה באחריות. התלמידה מחויבת למערכת שבנתה לעצמה, וכל שינוי או פרישה חייבים להיעשות בהליך רשמי מול המורה והחונך.',
      },
    ],
    correctOptionId: 'b',
    constitutionExcerpt: EXCERPT_CHOICE_FREEDOM,
  },
  {
    id: 'u2-q3',
    scenario:
      'תרחיש 3: פער בין רצון ליכולת מקצועית - תלמיד רוצה להשתלב בקורס מתמטיקה מתקדם, אך המורה טוענת שחסר לו ידע בסיסי. התלמיד טוען שזכותו לבחור לפי החוקה.',
    options: [
      { id: 'a', label: 'א.', text: 'התלמיד צודק, עקרון הבחירה גובר על שיקולי המורה.' },
      {
        id: 'b',
        label: 'ב.',
        text: 'הבחירה אם ללמוד היא של התלמיד, אך הקביעה המקצועית באיזו רמה הוא ישובץ היא בסמכות המורה בלבד.',
      },
    ],
    correctOptionId: 'b',
    constitutionExcerpt: EXCERPT_CHOICE_FREEDOM,
  },
];
