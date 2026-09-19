interface GuideBannerProps {
  itemName: string;
  path: string;
  offPath: boolean;
  onStop: () => void;
}

export function GuideBanner({ itemName, path, offPath, onStop }: GuideBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#FFF4C2] px-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#5C4400]">'{itemName}' 위치 안내 중</p>
        {offPath && <p className="truncate text-xs text-[#5C4400]">{path}</p>}
      </div>
      <button
        type="button"
        onClick={onStop}
        className="flex h-11 shrink-0 items-center justify-center rounded-[10px] border border-[#5C4400]/30 px-3 text-sm font-semibold text-[#5C4400] active:bg-[#5C4400]/10"
      >
        종료
      </button>
    </div>
  );
}
