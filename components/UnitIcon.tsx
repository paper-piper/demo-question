'use client';

/** A distinct icon per unit, per developer_instructions.docx ("לכל פרק אייקון ייחודי"). */
export function UnitIcon({ name, className }: { name: string; className?: string }) {
  const common = {
    className: className ?? 'step-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    // Unit 1 — authorities, freedom and boundaries
    case 'scales':
      return (
        <svg {...common}>
          <path d="M12 4v16M7 20h10M3 9h18M6 9l-3 5h6zM18 9l3 5h-6z" />
        </svg>
      );
    // Unit 2 — learning, choice and responsibility
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      );
    // Unit 3 — the mentor and the social group
    case 'people':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
          <path d="M16 5.2a3 3 0 010 5.6M18 20c0-2.4-.9-4-2.2-5" />
        </svg>
      );
    // Unit 4 — parent involvement
    case 'hands':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.2-7-9a3.6 3.6 0 016.3-2.4L12 9.7l.7-1.1A3.6 3.6 0 0119 11c0 4.8-7 9-7 9z" />
        </svg>
      );
    default:
      return null;
  }
}
