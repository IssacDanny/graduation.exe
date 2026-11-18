const PATHS = {
  // Digits 0-9: Monoline Sacred-Cyber Arch & Circle Runes (GENESIS style)
  '0': (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  '1': (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" />
    </>
  ),
  '2': (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <line x1="4.5" y1="12" x2="19.5" y2="12" />
    </>
  ),
  '3': (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 4.5V12M12 12L6 16.8M12 12L18 16.8" />
    </>
  ),
  '4': (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" />
      <line x1="4.5" y1="12" x2="19.5" y2="12" />
    </>
  ),
  '5': (
    <>
      <path d="M6 19V11A6 6 0 0 1 18 11V19" />
      <line x1="6" y1="13" x2="18" y2="13" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </>
  ),
  '6': (
    <>
      <rect x="5" y="5" width="14" height="14" rx="1" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </>
  ),
  '7': (
    <>
      <path d="M5.5 18.5L12 5.5L18.5 18.5Z" />
      <line x1="12" y1="5.5" x2="12" y2="18.5" />
    </>
  ),
  '8': (
    <>
      <rect x="5" y="5" width="14" height="14" rx="1" />
      <path d="M5 12H19M12 12V19" />
      <circle cx="12" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  '9': (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M6.5 7L17.5 17M17.5 7L6.5 17" />
    </>
  ),

  // Core Arithmetic & Rational Operators
  Add: (
    <>
      <path d="M5.5 18.5V11.5A6.5 6.5 0 0 1 18.5 11.5V18.5" />
      <path d="M9.5 18.5V12A2.5 2.5 0 0 1 14.5 12V18.5" />
      <line x1="12" y1="5" x2="12" y2="9.5" />
    </>
  ),
  Sub: (
    <>
      <path d="M5 8.5H19M5 15.5H19" />
      <path d="M9 5.5V18.5M15 5.5V18.5" />
    </>
  ),
  Mul: (
    <>
      <path d="M5.5 18.5L12 5.5L18.5 18.5Z" />
      <path d="M8.5 18.5A3.5 3.5 0 0 1 15.5 18.5" />
    </>
  ),
  Div: (
    <>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1" />
      <path d="M5.5 5.5L18.5 18.5M18.5 5.5L5.5 18.5" />
    </>
  ),
  Frac: (
    <>
      <path d="M5.5 18.5L18.5 5.5" />
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
    </>
  ),
  Reduce: (
    <>
      <path d="M5.5 19V11.5A6.5 6.5 0 0 1 18.5 11.5V19" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </>
  ),
  Rat: (
    <>
      <path d="M6 12C6 8 10 8 12 12C14 16 18 16 18 12C18 8 14 8 12 12C10 16 6 16 6 12Z" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </>
  ),
  Neg: (
    <>
      <path d="M6 12H18" />
      <path d="M6 19V12A6 6 0 0 1 18 12" />
    </>
  ),
  Abs: (
    <>
      <path d="M6 5V19M18 5V19" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),

  // Euclidean Division & Helper Rules (Curved cyber-glyphs matching reference)
  GCD: (
    <>
      <path d="M6 19V10A6 6 0 0 1 18 10" />
      <path d="M10 19V12A4 4 0 0 1 18 12V19" />
    </>
  ),
  IntDiv: (
    <>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1" />
      <path d="M5.5 5.5L12 12L18.5 5.5M12 12V18.5" />
    </>
  ),
  IntMod: (
    <>
      <path d="M12 5A7 7 0 1 0 19 12" />
      <path d="M12 9A3 3 0 1 1 9 12" />
      <circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  DivDigit: (
    <>
      <path d="M6 6H15A3 3 0 0 1 15 12H9A3 3 0 0 0 9 18H18" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" />
    </>
  ),
  ModDigit: (
    <>
      <path d="M6 18C6 12 18 12 18 6" />
      <path d="M6 6H12M12 18H18" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  DivStep: (
    <>
      <path d="M5.5 18.5L12 5.5L18.5 18.5Z" />
      <circle cx="12" cy="14" r="2" />
    </>
  ),
  ModStep: (
    <>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),

  // Minimalist Brackets & Separator
  '(': <path d="M15 5.5A6.5 6.5 0 0 0 15 18.5" strokeWidth="1.25" />,
  ')': <path d="M9 5.5A6.5 6.5 0 0 1 9 18.5" strokeWidth="1.25" />,
  ',': <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />,
};

export default function TrsGlyph({ tok, className = '' }) {
  const shape = PATHS[tok] || <circle cx="12" cy="12" r="3" />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {shape}
    </svg>
  );
}