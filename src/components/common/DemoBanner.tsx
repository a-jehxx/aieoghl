interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#E4E8F1] px-4 py-2">
      <p className="truncate text-sm font-medium text-navy">체험 모드 · 저장되지 않아요</p>
      <button
        type="button"
        onClick={onExit}
        className="flex h-11 shrink-0 items-center justify-center rounded-[10px] border border-navy/30 px-3 text-sm font-semibold text-navy active:bg-navy/10"
      >
        종료
      </button>
    </div>
  );
}
