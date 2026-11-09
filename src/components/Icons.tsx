/** Small line icons drawn at 24px and scaled by the caller. */
const PATHS: Record<string, React.ReactNode> = {
  menu: <><path d="M4 7h16" /><path d="M4 12h11" /><path d="M4 17h16" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  chat: <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z" />,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M5 20c1.1-3.4 3.8-5.2 7-5.2s5.9 1.8 7 5.2" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M15.5 15.5L20 20" /></>,
  left: <path d="M14.5 6l-6 6 6 6" />,
  right: <path d="M9.5 6l6 6-6 6" />,
  arrow: <><path d="M4 12h16" /><path d="M14 6l6 6-6 6" /></>,
};

export function Icon({ name, size = 18, stroke = 1.8 }: { name: keyof typeof PATHS | string; size?: number; stroke?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

/** The Le-SWAP mark: a half-shaded arrowhead, after the reference's logo. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M5 3.5L12 12 5 20.5z" fill="currentColor" opacity=".28" />
      <path d="M12 12L5 3.5l14 8.5-14 8.5z" fill="currentColor" />
    </svg>
  );
}
