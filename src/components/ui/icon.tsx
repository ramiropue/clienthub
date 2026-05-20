import React from 'react';

const I: Record<string, React.ReactNode> = {
  // navigation
  dashboard: <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6ZM13 3v6h8V3h-8Z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3 3.4-5 6.5-5s5.9 2 6.5 5" /><circle cx="17" cy="7" r="2.8" /><path d="M14.5 14.2C16 13.5 17 13 17.5 13c2.5 0 4.6 1.6 5 4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  invoice: <><path d="M5 3h11l3.5 3.5V21H5V3Z" /><path d="M15.5 3v4H20M9 12h7M9 16h7M9 8h2" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 8v5l3.5 2" /></>,
  settings: <><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14.5a8 8 0 0 0 0-5l1.6-1.3-2-3.4-2 .8a8 8 0 0 0-4.4-2.5l-.3-2.1h-4l-.3 2.1a8 8 0 0 0-4.4 2.5l-2-.8-2 3.4 1.6 1.3a8 8 0 0 0 0 5l-1.6 1.3 2 3.4 2-.8a8 8 0 0 0 4.4 2.5l.3 2.1h4l.3-2.1a8 8 0 0 0 4.4-2.5l2 .8 2-3.4-1.6-1.3Z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20.5 20.5l-5-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron_down: <path d="M6 9l6 6 6-6" />,
  chevron_left: <path d="M14 6l-6 6 6 6" />,
  chevron_right: <path d="M10 6l6 6-6 6" />,
  arrow_right: <path d="M5 12h14M13 5l7 7-7 7" />,
  arrow_up_right: <path d="M7 17 17 7M8 7h9v9" />,
  download: <><path d="M12 4v12M6 12l6 6 6-6" /><path d="M4 20h16" /></>,
  close: <path d="M6 6l12 12M6 18L18 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  more: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2.5" /><circle cx="9" cy="9" r="1.7" /><path d="M21 16l-5-5L5 21" /></>,
  layers: <><path d="M12 3 2 8.5 12 14l10-5.5L12 3Z" /><path d="m2 13.5 10 5.5 10-5.5M2 17.5l10 5.5 10-5.5" /></>,
  compass: <><circle cx="12" cy="12" r="9.5" /><path d="m15.5 8.5-2 6-6 2 2-6 6-2Z" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></>,
  chat: <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12Z" />,
  wrench: <path d="m14.5 6.5 3-3a5 5 0 0 0-6.6 6.6l-7.4 7.4a2 2 0 0 0 2.8 2.8l7.4-7.4a5 5 0 0 0 6.6-6.6l-3 3-2.8-2.8Z" />,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  paperclip: <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L15 7.5" />,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />,
  desktop: <><rect x="2.5" y="4" width="19" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  send: <path d="M21 3 3 11l7 3 3 7 8-18Z" />,
  smile: <><circle cx="12" cy="12" r="9.5" /><path d="M8.5 14s1.3 2 3.5 2 3.5-2 3.5-2" /><circle cx="9" cy="10" r=".8" fill="currentColor" /><circle cx="15" cy="10" r=".8" fill="currentColor" /></>,
  star: <path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.2L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9L12 3Z" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m14 6 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  receipt: <path d="M5 2h14v20l-3.5-2L12 22l-3.5-2L5 22V2Z M8 8h8 M8 12h8 M8 16h5" />,
  external: <><path d="M14 4h6v6" /><path d="M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
};

export function Icon({ 
  name, 
  size = 16, 
  stroke = 1.6, 
  className, 
  style 
}: { 
  name: string; 
  size?: number | string; 
  stroke?: number; 
  className?: string; 
  style?: React.CSSProperties 
}) {
  const path = I[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
