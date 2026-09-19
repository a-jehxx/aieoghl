import type { ReactNode } from 'react';
import { House } from 'lucide-react';

interface TopBarProps {
  title: string;
  onBack: () => void;
  onHome: () => void;
  extra?: ReactNode;
}

export function TopBar({ title, onBack, onHome, extra }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-navy px-1">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-white active:bg-white/10"
      >
        ←
      </button>
      <h1 className="flex-1 truncate px-2 text-center text-lg font-semibold text-white">
        {title}
      </h1>
      <div className="flex shrink-0 items-center">
        {extra}
        <button
          type="button"
          onClick={onHome}
          aria-label="홈으로"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
        >
          <House size={22} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
