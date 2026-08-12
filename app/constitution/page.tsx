import type { Metadata } from 'next';
import Link from 'next/link';
import { CONSTITUTION_SECTIONS } from '@/content/constitution';
import { Blocks } from '@/components/RichText';

export const metadata: Metadata = {
  title: 'חוקת בית הספר — דמוקרטי לב השרון',
  description: 'הטקסט המלא של חוקת בית הספר דמוקרטי לב השרון.',
};

export default function ConstitutionPage() {
  return (
    <div className="app">
      <main className="shell">
        <div className="card">
          <p className="eyebrow">המקור המלא</p>
          <h1 className="screen-title">חוקת בית הספר</h1>
          <p className="body-p">
            דמוקרטי לב השרון — עקרונות מכוננים, מוסדות בית הספר וחובות חברי הקהילה, במלואם.
          </p>

          <nav aria-label="תוכן עניינים" style={{ marginTop: 18, marginBottom: 8 }}>
            <ul className="body-list">
              {CONSTITUTION_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </nav>

          {CONSTITUTION_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} style={{ marginTop: 32 }}>
              <h2 className="section-heading">{section.title}</h2>
              <Blocks blocks={section.blocks} />
            </section>
          ))}

          <div className="nav-row" style={{ marginTop: 24 }}>
            <Link href="/" className="btn btn-primary">
              → חזרה ללומדה
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
