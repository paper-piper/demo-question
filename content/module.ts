/**
 * LOCKED CONTENT — source of truth: content/source/questionniere_content.docx
 *
 * Every Hebrew string in this file is copied verbatim from a programmatic
 * extraction of the docx (see scripts/extract-docx.py). Do not reword, fix
 * grammar, shorten, reorder or add content. If you change the docx, re-run the
 * extraction and update this file to match.
 *
 * The only strings NOT from the docx are short generic UI feedback labels
 * (`correctFeedback` / `incorrectFeedback`), which the docx does not supply but
 * developer_instructions.docx explicitly requires ("הודעת הצלחה קצרה" /
 * "הסבר קצר"). They are marked below.
 *
 * `constitutionExcerpt` fields quote content/constitution.ts, which is itself
 * a verbatim extraction of content/source/חוקה-הדמוקרטי-לב-השרון.pdf — the
 * school's actual constitution.
 *
 * EXCEPTION: the quiz's `questions` (unit 2) are no longer part of this
 * locked file — they're sourced from content/quiz-questions.generated.ts,
 * which is regenerated from the "Questions" tab of the Google Sheet before
 * every build. See docs/google-sheets-setup.md.
 */

import { EXCERPT_AUTHORITIES, EXCERPT_MENTORING } from './constitution';
import { QUIZ_QUESTIONS } from './quiz-questions.generated';

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export interface KnowledgeSlide {
  kind: 'knowledge';
  id: string;
  heading?: string;
  blocks: Block[];
}

export interface SortItem {
  id: string;
  text: string;
  bucketId: string;
}

export interface SortBucket {
  id: string;
  label: string;
}

export interface SortActivity {
  kind: 'sort';
  id: string;
  heading: string;
  instruction: string;
  buckets: SortBucket[];
  items: SortItem[];
  constitutionExcerpt: Block[];
}

export interface QuizOption {
  id: string;
  label: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  options: QuizOption[];
  correctOptionId: string;
  constitutionExcerpt: Block[];
}

export interface QuizActivity {
  kind: 'quiz';
  id: string;
  heading: string;
  instruction: string;
  questions: QuizQuestion[];
}

export interface MatchPair {
  id: string;
  need: string;
  response: string;
}

export interface MatchActivity {
  kind: 'match';
  id: string;
  heading: string;
  instruction: string;
  pairs: MatchPair[];
  constitutionExcerpt: Block[];
}

export interface BoardActivity {
  kind: 'board';
  id: string;
  heading: string;
  blocks: Block[];
  nameFieldLabel: string;
  initiativeFieldLabel: string;
  examplesIntro: string;
  examples: string[];
}

export type Activity = SortActivity | QuizActivity | MatchActivity | BoardActivity;
export type Slide = KnowledgeSlide | Activity;

/** Photos live at /public/photos/units/{unit}/photo-{1..count}.jpg. */
function unitPhotos(unit: number, count: number, alt: string) {
  return Array.from({ length: count }, (_, i) => ({
    src: `/photos/units/${unit}/photo-${i + 1}.jpg`,
    alt: `${alt} (${i + 1})`,
  }));
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  icon: string;
  /** Presentational only — not part of the docx text, so free to set/repeat. */
  photos: { src: string; alt: string }[];
  slides: Slide[];
}

/* Generic UI feedback strings required by developer_instructions.docx.
   NOT from questionniere_content.docx. */
export const FEEDBACK = {
  correct: 'כל הכבוד! בדיוק כך.',
  incorrect: 'לא בדיוק. הציצו בחוקה ונסו שוב.',
  popupTrigger: 'לא בטוחים? הציצו בחוקה',
} as const;

export const OPENING = {
  title: 'דמוקרטי לב השרון מהלכה למעשה',
  subtitle: 'לומדה לחברי קהילת בית הספר',
  blocks: [
    { type: 'paragraph', text: 'ברוכים הבאים לקהילת דמוקרטי לב השרון!' },
    {
      type: 'paragraph',
      text: 'אנו שמחים להזמינכם למסע היכרות עם הבית החינוכי שלנו – בית הספר שלנו אינו רק מוסד לימודי, אלא קהילה חיה, ריבונית ויוצרת.',
    },
    {
      type: 'paragraph',
      text: 'לומדה זו נועדה לסייע לכם להכיר לעומק את עקרונות חוקת בית הספר ואת הערכים המכוננים שעומדים בבסיס המודל הדמוקרטי.',
    },
    {
      type: 'paragraph',
      text: 'אך מעבר לכך, הלומדה תעזור לכם להבין: איך כל זה נראה ביומיום?',
    },
    {
      type: 'paragraph',
      text: 'המעבר מהלכה למעשה הוא הרגע שבו העקרונות הדמוקרטיים פוגשים את המציאות בשטח – את בניית מערכת השעות האישית, את המפגשים החברתיים ואת שיחות החונכות.',
    },
    {
      type: 'paragraph',
      text: 'כאן לא רק "לומדים דמוקרטיה" אלא חיים דמוקרטיה בכל בחירה, בכל הצבעה בפרלמנט ובכל קשר אישי שנרקם בקהילה.',
    },
  ] as Block[],
  startButton: 'בואו נתחיל!',
};

const UNIT_1_AUTHORITIES: Block[] = [
  {
    type: 'list',
    items: [
      'הרשות המחוקקת (הפרלמנט): הריבון בבית הספר. חברים בו כל הילדים, אנשי הצוות וההורים. הוא מוסמך לחוקק חוקים, לבחור מנהל, לבחור את חברי הוועדות ולאשר תקציב.',
      'הרשות המבצעת (הנהלה וועדות): אמונה על הניהול השוטף ויישום החלטות הפרלמנט. היא כוללת ועדות חובה כגון כספים, חינוך, ביקורת וקבלת אנשי צוות.',
      'הרשות השופטת (ועדות משמעת, ערעורים וגישור): הגופים היחידים המוסמכים להטיל עונשים. חוקי בית הספר חלים על כולם – ילדים ומבוגרים כאחד.',
      'העמותה: הגוף האחראי להבטיח את קיום בית הספר ברוח החוקה "מכאן ולעולם", מנהל את המשאבים הכלכליים ומשמש כמעסיק.',
    ],
  },
];

const UNIT_2_PRINCIPLES: Block[] = [
  {
    type: 'list',
    items: [
      'זכות התכנון: לילד יש זכות מלאה לבחור את קורסיו, ואין חובת למידה פורמלית של מקצועות ליבה. הזכות לבחור קיימת כבר מגיל הגן.',
      'חופש מכפייה: אנו מאמינים כי החופש מאפשר מימוש עצמי ומעודד למידה מתוך מוטיבציה פנימית.',
      'בחירה ואחריות: הבחירה כרוכה באחריות. תלמיד מחויב למערכת שבנה לעצמו.',
    ],
  },
];

const UNIT_3_MENTORING: Block[] = [
  {
    type: 'list',
    items: [
      'חובה וזכות: לכל ילד בבית הספר חייב להיות חונך אישי, והילד הוא זה שבוחר את זהות החונך שלו.',
      'תפקיד החונך: החונך אינו שוטר, אלא מלווה חינוכי המסייע בגילוי עצמי, זיהוי מטרות ובניית תוכנית לימודים אישית.',
      'מבנה החונכות: פגישת חונכות סדורה (פעם בשבוע למשך כרבע שעה).',
      'המבנה החברתי: הקהילה מאורגנת ב"בתים" רב-גילאיים (דו-גילאיים או תלת-גילאיים) המעודדים קשרים מעבר לקבוצת הגיל המצומצמת.',
    ],
  },
];

export const UNITS: Unit[] = [
  {
    id: 'unit-1',
    number: 1,
    title: 'יחידה 1: רשויות, חופש וגבולות',
    icon: 'scales',
    photos: unitPhotos(1, 3, 'מפגש קהילתי בפרלמנט בית הספר'),
    slides: [
      {
        kind: 'knowledge',
        id: 'u1-k1',
        blocks: [
          {
            type: 'paragraph',
            text: 'בדמוקרטי, הכוח אינו מרוכז בידי אדם אחד אלא פועל דרך ארבע רשויות המבוססות על עקרון הפרדת הרשויות:',
          },
          ...UNIT_1_AUTHORITIES,
        ],
      },
      {
        kind: 'knowledge',
        id: 'u1-k2',
        blocks: [
          {
            type: 'paragraph',
            text: 'החופש בבית הספר הוא חופש בתוך מסגרת. הגבולות נקבעים על ידי חוקי הפרלמנט וחוקי המדינה (כמו איסור עישון בתוך מוסד חינוכי), והם חלים על כולם באופן שווה. מורים רשאים לתת תוצאות למעשים במסגרת ניהול השיעור. למשל: מורה רשאי להוציא ילד מפריע מהכיתה (לאחר מספר אזהרות) כדי לאפשר לשיעור להתקיים, אך הוא אינו מוסמך להטיל עליו עונש מעבר לכך.',
          },
          {
            type: 'paragraph',
            text: 'כחלק מהגבולות המגדירים את המסגרת, לבית הספר שעות פעילות קבועות וברורות:',
          },
          {
            type: 'list',
            items: [
              "בימים א', ג'-ה': שעות הפעילות הן 08:30-14:00.",
              "ביום ב': יום הלימודים מסתיים בשעה 13:05.",
              'תלמידים הלומדים לבחינות בגרות: מסיימים את יומם בשעה 15:15.',
              'יום שישי: זהו יום בחירה המופעל על ידי הורים מתנדבים.',
            ],
          },
          {
            type: 'paragraph',
            text: 'נוכחות בוקר: במסגרת חובותיהם, כל ילד וילדה בבית הספר חייבים להפגין נוכחות ולהיפגש עם חונך או איש צוות בתחילת כל יום לימודים. דרישה זו, לצד השהייה בבית הספר בכפוף לחוקיו, היא חלק מהאחריות האישית של התלמיד בתוך המרחב הדמוקרטי.',
          },
        ],
      },
      {
        kind: 'sort',
        id: 'u1-a1',
        heading: 'יחידה 1: משחק מיון רשויות (גרירת היגדים)',
        instruction: 'גררו כל היגד אל "הרשות" האחראית עליו לפי חוקת בית הספר.',
        buckets: [
          { id: 'legislative', label: 'הרשות המחוקקת (הפרלמנט)' },
          { id: 'executive', label: 'הרשות המבצעת (הנהלה וועדות)' },
          { id: 'judicial', label: 'הרשות השופטת (ועדות משמעת וערעורים)' },
          { id: 'association', label: 'העמותה' },
        ],
        items: [
          { id: 's1', text: 'חקיקת חוקי בית הספר.', bucketId: 'legislative' },
          { id: 's2', text: 'אישור תקציב בית הספר.', bucketId: 'legislative' },
          { id: 's3', text: 'בחירה או פיטורין של מנהל/ת בית הספר.', bucketId: 'legislative' },
          { id: 's4', text: 'דיון בשינוי סעיפי החוקה.', bucketId: 'legislative' },
          { id: 's5', text: 'ניהולו השוטף של בית הספר.', bucketId: 'executive' },
          { id: 's6', text: 'קבלת אנשי צוות חדשים לקהילה.', bucketId: 'executive' },
          { id: 's7', text: 'פיקוח פדגוגי על רמת ההוראה (ועדת חינוך).', bucketId: 'executive' },
          { id: 's8', text: 'יישום החלטות שהתקבלו בפרלמנט.', bucketId: 'executive' },
          { id: 's9', text: 'הטלת עונשים (תוצאות) על חברי קהילה שעברו על החוק.', bucketId: 'judicial' },
          { id: 's10', text: 'פסילת חוק פרלמנט שנוגד את החוקה (ועדת ערעורים).', bucketId: 'judicial' },
          { id: 's11', text: 'דיון ופסיקה בתלונות בין חברי הקהילה.', bucketId: 'judicial' },
          { id: 's12', text: 'קביעת הגובה המקסימלי של שכר הלימוד.', bucketId: 'association' },
          { id: 's13', text: 'הבטחת קיום בית הספר כדמוקרטי "מכאן ולעולם".', bucketId: 'association' },
          { id: 's14', text: 'אישור סופי של מינוי המנהל שנבחר.', bucketId: 'association' },
        ],
        constitutionExcerpt: EXCERPT_AUTHORITIES,
      },
    ],
  },
  {
    id: 'unit-2',
    number: 2,
    title: 'יחידה 2: למידה, בחירה ואחריות',
    icon: 'compass',
    photos: unitPhotos(2, 8, 'תלמידים לומדים ומשחקים מתוך בחירה חופשית'),
    slides: [
      {
        kind: 'knowledge',
        id: 'u2-k1',
        blocks: [
          {
            type: 'paragraph',
            text: 'עקרון היסוד הוא ריבונות הילד וזכותו לתכנן את זמנו ולבחור מה וכיצד ללמוד.',
          },
          ...UNIT_2_PRINCIPLES,
          {
            type: 'paragraph',
            text: 'בית הספר רואה בפרט חלק מקהילה. לצד מימוש עצמי, המערכת שמה דגש על למידה פלורליסטית, קבלת האחר ושמירה על זכויות הזולת במרחב הציבורי.',
          },
        ],
      },
      {
        kind: 'quiz',
        id: 'u2-a1',
        heading: 'יחידה 2: חידון דילמות "בונים מערכת"',
        instruction: 'קראו את התרחישים הבאים ובחרו בתגובה התואמת את עקרונות הבחירה והאחריות.',
        questions: QUIZ_QUESTIONS,
      },
    ],
  },
  {
    id: 'unit-3',
    number: 3,
    title: 'יחידה 3: תפקיד החונך והקבוצה החברתית',
    icon: 'people',
    photos: unitPhotos(3, 4, 'ילדים בפעילות חברתית משותפת'),
    slides: [
      {
        kind: 'knowledge',
        id: 'u3-k1',
        blocks: [
          {
            type: 'paragraph',
            text: 'החונכות היא מוסד המגלם את תפיסת העולם החינוכית שלנו ומטרתה יצירת דיאלוג משמעותי וקשר אישי בין הילד למבוגר.',
          },
          ...UNIT_3_MENTORING,
        ],
      },
      {
        kind: 'match',
        id: 'u3-a1',
        heading: 'יחידה 3: משחק התאמה – מודל החונכות',
        instruction: 'התאימו בין הצרכים של הילד לבין התפקיד המדויק של החונך לפי החוקה.',
        pairs: [
          {
            id: 'm1',
            need: 'אני לא בטוחה מה המטרות שלי השנה ומה מעניין אותי ללמוד.',
            response:
              'סיוע בגילוי עצמי ובניית תוכנית לימודים אישית המשלבת רצונות ומטרות.',
          },
          {
            id: 'm2',
            need: "אני מרגיש שקשה לי חברתית בתוך ה'בית' שלי.",
            response: 'קיום דיאלוג משמעותי וקשר אישי בלתי פורמלי התומך בילד.',
          },
        ],
        constitutionExcerpt: EXCERPT_MENTORING,
      },
    ],
  },
  {
    id: 'unit-4',
    number: 4,
    title: 'יחידה 4: מעורבות הורים',
    icon: 'hands',
    photos: unitPhotos(4, 3, 'מפגש הורים וצוות בקהילת בית הספר'),
    slides: [
      {
        kind: 'knowledge',
        id: 'u4-k1',
        blocks: [
          {
            type: 'paragraph',
            text: 'ההורים בקהילתנו הם שותפים לדרך, והאחריות על למידת הילד היא משותפת לילד ולהוריו.',
          },
          {
            type: 'list',
            items: [
              'שותפות ולא שיטור: מעורבות הורים נחשבת למפתח להצלחה, כאשר היא נעשית מתוך מקום של נוכחות וידיעה, ולא מתוך פיקוח.',
              'הערכה אישית: ההערכה בבית הספר היא "מעצבת" ואישית. היא אינה מספרית או תחרותית, אלא בוחנת את התקדמות הילד ביחס לעצמו.',
              'יוזמה הורית: הורים מוזמנים להיות מעורבים באופן פעיל, בועדות, פרלמנטים, הדרכת קורס בהתנדבות ועוד.',
              'חובות ההורים: אחריות לצרכי הילד, דיאלוג רצוף עם החונך ותשלום שכר הלימוד (הנקבע על ידי העמותה). מקור המימון העיקרי של בית הספר הוא תקצוב משרד החינוך (כ-60%-70% מהתקציב). תשלומי ההורים הם רק אחד מארבעה מקורות מימון.',
            ],
          },
        ],
      },
      {
        kind: 'board',
        id: 'u4-a1',
        heading: 'יחידה 4: לוח שיתופי - "שוק מעורבות הורים"',
        blocks: [
          {
            type: 'paragraph',
            text: 'ברוכים הבאים ל"שוק יוזמות הורים" של דמוקרטי לב השרון!',
          },
          {
            type: 'paragraph',
            text: 'בבית הספר שלנו, הקהילה היא ישות חיה, ריבונית ויוצרת. אנו מאמינים כי ההורים הם שותפים מלאים לדרך והמעורבות שלכם היא אחד המפתחות המרכזיים להצלחת הקהילה.',
          },
          {
            type: 'paragraph',
            text: 'הלוח הזה הוא המקום שבו ה"הלכה" של החוקה הופכת ל"מעשה". אנו מזמינים אתכם להציע כאן יוזמות, כישורים או תחומי עניין שתרצו לחלוק עם הקהילה – החל מהנחיית קורס ועד סיוע בתחזוקת החצר.',
          },
          {
            type: 'paragraph',
            text: 'איך משתתפים? הוסיפו "פתק" חדש ללוח ובו ציינו:',
          },
        ],
        nameFieldLabel: 'שמכם המלא: כדי שנוכל להכיר ולפנות אליכם לקידום היוזמה.',
        initiativeFieldLabel:
          'מה היוזמה או המעורבות שלכם? תיאור קצר של מה הייתם רוצים להוסיף לקהילה.',
        examplesIntro: 'צריכים השראה? הנה כמה דוגמאות ברוח החוקה:',
        examples: [
          'הנחיית קורס',
          'השתתפות בוועדת אירועים',
          'ליווי מסעות וטיולים',
          'התנדבות בימי גיוס עבודה ובנייה בחצר',
          'הובלת יוזמות ביום שישי',
        ],
      },
    ],
  },
];

export const SUMMARY_LINE =
  'לסיכום: המעבר מהלכה למעשה הוא הרגע שבו אנו בוחרים בכל יום מחדש לחיות כקהילה דמוקרטית, שוויונית ופלורליסטית.';

export const DECLARATION = {
  screenTitle: 'מסך הצהרה',
  nameFieldLabel: 'שם חבר/י הקהילה',
  phoneFieldLabel: 'מספר טלפון (לא חובה)',
  text: 'אני מצהיר/ה כי למדתי את עקרונות החוקה וערכי בית הספר, ביצעתי את ההתנסות בדילמות מחיי היום-יום והשלמתי את הלומדה. אני מקבל/ת עליי את האחריות כחבר/ה בקהילת דמוקרטי לב השרון.',
  checkboxLabel: 'קראתי ואני מאשר/ת את ההצהרה',
  confirmButton: 'אישור ההצהרה',
};

export const COMPLETION = {
  title: 'מזל טוב! השלמתם בהצלחה את הלומדה!',
  blocks: [
    {
      type: 'paragraph',
      text: 'כעת, כשאתם מכירים את העקרונות המכוננים ואת המעבר מהלכה למעשה, אתם מוכנים לקחת חלק פעיל בדמוקרטי לב השרון. אנו מאחלים לכם נחיתה רכה ושותפות פורייה.',
    },
    { type: 'paragraph', text: 'נתראה בפרלמנט!' },
  ] as Block[],
};

/**
 * Terms highlighted in colour (not bold only), per developer_instructions.docx.
 *
 * Matching is whole-word (see components/RichText.tsx), so Hebrew prefixed
 * forms are listed explicitly rather than matched as substrings — otherwise
 * "ועדה" would highlight the middle of an unrelated word like "נועדה".
 */
export const KEY_TERMS: string[] = [
  // the four authorities
  'הרשות המחוקקת',
  'הרשות המבצעת',
  'הרשות השופטת',
  'הפרדת הרשויות',
  'ארבע רשויות',
  // sovereignty of the child
  'ריבונות הילד',
  // personal mentor
  'חונך אישי',
  'החונכות',
  'חונכות',
  'החונך',
  'חונך',
  'לחונך',
  // parliament
  'הפרלמנט',
  'בפרלמנט',
  'פרלמנטים',
  'פרלמנט',
  // the association
  'העמותה',
  'עמותה',
  // committees
  'הוועדות',
  'ועדות',
  'בועדות',
  'ועדת',
  'ועדה',
  // choice
  'בחירה',
  'הבחירה',
  // responsibility
  'אחריות',
  'ואחריות',
  'האחריות',
  'באחריות',
  // other constitutional terms
  'נוכחות בוקר',
  'שכרון חופש',
  'שכרון החופש',
  'מוטיבציה פנימית',
  'מעורבות הורים',
];
