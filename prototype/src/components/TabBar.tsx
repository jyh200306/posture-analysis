import { Icon } from './Icon';
import type { IconName } from './Icon';

export type Tab = 'home' | 'analyze' | 'report' | 'coach' | 'history';

const TABS: Array<{ id: Tab; icon: IconName; label: string }> = [
  { id: 'home', icon: 'home', label: '홈' },
  { id: 'analyze', icon: 'scan', label: '분석' },
  { id: 'report', icon: 'report', label: '리포트' },
  { id: 'coach', icon: 'activity', label: '자세교정' },
  { id: 'history', icon: 'chart', label: '기록' },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tabbar-item${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <Icon name={tab.icon} size={23} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
