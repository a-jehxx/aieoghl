import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  onBack: () => void;
  onHome: () => void;
  extra?: ReactNode;
}

export function TopBar({ title, onBack, onHome, extra }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-card px-1">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl text-ink active:bg-bg"
      >
        ←
      </button>
      <h1 className="flex-1 truncate px-2 text-center text-[24px] font-bold text-ink">
        {title}
      </h1>
      <div className="flex shrink-0 items-center">
        {extra}
        <button
          type="button"
          onClick={onHome}
          aria-label="홈으로"
          className="flex h-12 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-lg font-medium text-ink active:bg-bg"
        >
          🏠 홈
        </button>
      </div>
    </header>
  );
}
