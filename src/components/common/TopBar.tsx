interface TopBarProps {
  title: string;
  onBack: () => void;
  onHome: () => void;
}

export function TopBar({ title, onBack, onHome }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-1">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로가기"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-slate-700 active:bg-slate-100"
      >
        ←
      </button>
      <h1 className="flex-1 truncate px-2 text-center text-lg font-semibold text-slate-900">
        {title}
      </h1>
      <button
        type="button"
        onClick={onHome}
        aria-label="홈으로"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-slate-100"
      >
        🏠
      </button>
    </header>
  );
}
