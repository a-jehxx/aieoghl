interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-violet-200 bg-violet-100 px-3 py-2">
      <p className="truncate text-sm font-medium text-violet-900">체험 모드 · 저장되지 않아요</p>
      <button
        type="button"
        onClick={onExit}
        className="h-8 shrink-0 rounded-lg px-2 text-sm font-semibold text-violet-900 underline active:opacity-70"
      >
        종료
      </button>
    </div>
  );
}
