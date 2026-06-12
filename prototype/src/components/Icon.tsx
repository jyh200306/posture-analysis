import type { ReactNode } from 'react';

export type IconName =
  | 'home'
  | 'scan'
  | 'activity'
  | 'chart'
  | 'sliders'
  | 'camera'
  | 'image'
  | 'check'
  | 'chevron'
  | 'back'
  | 'close'
  | 'play'
  | 'pause'
  | 'flame'
  | 'clock'
  | 'refresh';

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="9.5" r="2.2" />
      <path d="M8.5 17c.6-2.1 1.9-3.2 3.5-3.2s2.9 1.1 3.5 3.2" />
    </>
  ),
  activity: <path d="M3 12.5h3.5L9 6l4.5 12 2.5-5.5H21" />,
  chart: (
    <>
      <path d="M5 20v-7" />
      <path d="M12 20V5.5" />
      <path d="M19 20v-10" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7.5h16" />
      <circle cx="9.5" cy="7.5" r="2.2" />
      <path d="M4 16.5h16" />
      <circle cx="14.5" cy="16.5" r="2.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 9a2 2 0 0 1 2-2h2l1.6-2.2h4.8L16 7h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="m5 17 4.5-4.5 3.5 3.5 2.5-2.5L19 17" />
    </>
  ),
  check: <path d="m5.5 12.5 4 4 9-9.5" />,
  chevron: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  back: (
    <>
      <path d="M19 12H5.5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  close: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />,
  play: <path d="M8.5 5.8v12.4L18.5 12Z" fill="currentColor" strokeWidth={0} />,
  pause: <path d="M9 6v12M15 6v12" />,
  flame: (
    <path d="M12 4c1.2 2.8 4 4.6 4 8.2a4 4 0 0 1-8 0c0-1.6.6-3 1.7-4.3.3 1 .8 1.8 1.5 2.3C10.9 8.3 11.3 6 12 4Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.3l3 1.7" />
    </>
  ),
  refresh: (
    <>
      <path d="M4.5 5.5v4.7h4.7" />
      <path d="M5 13.5a7.2 7.2 0 1 0 .9-5L4.5 10" />
    </>
  ),
};

interface Props {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 22 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
