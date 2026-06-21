interface Props {
  size?: number;
  withText?: boolean;
}

/** 워크모션 로고 — 수직 정렬선 위에 바르게 선 사람을 형상화한 마크 */
export function Logo({ size = 26, withText = true }: Props) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
        <rect x="1" y="1" width="26" height="26" rx="8" fill="var(--primary)" />
        <circle cx="14" cy="8.2" r="2.6" fill="var(--paper)" />
        <path
          d="M14 12.4v7.4"
          stroke="var(--paper)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M9.2 21.6h9.6"
          stroke="var(--paper)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {withText && <span className="logo-text">워크모션</span>}
    </span>
  );
}
