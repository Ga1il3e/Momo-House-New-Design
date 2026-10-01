export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="33" r="30" stroke="#c2a14d" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="32" cy="33" r="26.5" stroke="#c2a14d" strokeOpacity="0.9" strokeWidth="1.2" />
      <path d="M20 41a12.5 12.5 0 0 1 25 0" stroke="#e6c877" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M25.5 30.5 24 41 M32 28.5V41 M38.5 30.5 40 41"
        stroke="#e6c877"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M17.5 45.5h29" stroke="#c2a14d" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M32 15.5c-1.8 2.6 1.8 3.6 0 6.4" stroke="#c2a14d" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
