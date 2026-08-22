import { RebuildButton } from './RebuildButton';

export default function RebuildPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const key = searchParams?.key ?? '';

  return (
    <div className="app">
      <main className="shell">
        <div className="card">
          <p className="eyebrow">ניהול תוכן</p>
          <h1 className="screen-title">עדכון שאלות השאלון</h1>
          <p className="body-p">
            ערכתם את גיליון השאלות ב-Google Sheets? לחצו על הכפתור כדי לפרסם את
            העדכון באתר. התהליך אורך כמה דקות.
          </p>
          <RebuildButton secretKey={key} />
        </div>
      </main>
    </div>
  );
}
