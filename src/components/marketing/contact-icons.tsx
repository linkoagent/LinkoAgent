export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="WhatsApp">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M12.02 5.5c-3.6 0-6.52 2.92-6.52 6.52 0 1.15.3 2.27.87 3.26L5.5 18.5l3.32-.87a6.5 6.5 0 0 0 3.2.84h.01c3.6 0 6.52-2.92 6.52-6.52 0-1.74-.68-3.38-1.91-4.61a6.48 6.48 0 0 0-4.62-1.91Zm0 11.93h-.01a5.4 5.4 0 0 1-2.76-.76l-.2-.12-1.97.52.53-1.92-.13-.2a5.41 5.41 0 0 1-.83-2.9 5.42 5.42 0 0 1 5.42-5.42c1.45 0 2.8.56 3.83 1.59a5.38 5.38 0 0 1 1.59 3.83 5.42 5.42 0 0 1-5.47 5.38Zm2.97-4.06c-.16-.08-.96-.47-1.11-.53-.15-.05-.26-.08-.37.08-.11.16-.42.53-.52.63-.09.11-.19.12-.35.04-.16-.08-.68-.25-1.29-.79-.48-.42-.8-.95-.9-1.1-.09-.16-.01-.25.07-.32.07-.07.16-.19.24-.28.08-.09.11-.16.16-.27.05-.11.03-.2-.01-.28-.05-.08-.37-.88-.5-1.21-.13-.31-.27-.27-.37-.28h-.32c-.11 0-.28.04-.43.2-.15.16-.56.55-.56 1.34s.58 1.56.66 1.67c.08.11 1.15 1.75 2.78 2.46.39.17.69.27.93.34.39.13.74.11 1.02.06.31-.04.96-.39 1.09-.77.14-.38.14-.7.1-.77-.05-.07-.15-.11-.31-.19Z"
      />
    </svg>
  );
}

export function EmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Email">
      <circle cx="12" cy="12" r="12" fill="#7C4DFF" />
      <path
        fill="#FFFFFF"
        d="M5.5 8.25A1.25 1.25 0 0 1 6.75 7h10.5a1.25 1.25 0 0 1 1.25 1.25v7.5a1.25 1.25 0 0 1-1.25 1.25H6.75a1.25 1.25 0 0 1-1.25-1.25v-7.5Z"
        opacity="0"
      />
      <path
        fill="#FFFFFF"
        d="M6 7.5h12c.55 0 1 .45 1 1v.2l-7 4.4-7-4.4v-.2c0-.55.45-1 1-1Zm-1 2.58 6.47 4.06c.33.2.73.2 1.06 0L19 10.08v6.42c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-6.42Z"
      />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  const gradientId = "instagram-gradient";
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Instagram">
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="20%" stopColor="#FFDD55" />
          <stop offset="40%" stopColor="#F56040" />
          <stop offset="65%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#5851DB" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill={`url(#${gradientId})`} />
      <rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="2.6" fill="none" stroke="#FFFFFF" strokeWidth="1.3" />
      <circle cx="15.1" cy="8.9" r="0.6" fill="#FFFFFF" />
    </svg>
  );
}

export function contactIconFor(label: string) {
  if (label === "WhatsApp") return WhatsAppIcon;
  if (label === "Email") return EmailIcon;
  if (label === "Instagram") return InstagramIcon;
  return null;
}
