interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-soft px-4 py-2">
      <p className="truncate text-[15px] font-medium text-navy">체험 모드 · 저장되지 않아요</p>
      <button
        type="button"
        onClick={onExit}
        className="flex h-12 shrink-0 items-center justify-center rounded-full border border-navy/30 px-4 text-[15px] font-semibold text-navy active:bg-navy/10"
      >
        종료
      </button>
    </div>
  );
}
