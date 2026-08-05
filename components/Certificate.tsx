'use client';

import { MODULE_NAME } from '@/lib/config';

/**
 * Certificate — name, module name, date. Deliberately carries no score or
 * percentage: passing this module is completion-based.
 */
export function Certificate({ name, date }: { name: string; date: Date }) {
  const formatted = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return (
    <div className="certificate">
      <p className="cert-eyebrow">תעודת סיום</p>
      <p className="cert-module" style={{ margin: 0 }}>
        ניתנת בזאת ל
      </p>
      <p className="cert-name">{name}</p>
      <div className="cert-rule" />
      <p className="cert-module">
        על השלמת הלומדה
        <br />
        <strong>{MODULE_NAME}</strong>
        <br />
        לומדה לחברי קהילת בית הספר
      </p>
      <p className="cert-date">{formatted}</p>
    </div>
  );
}
