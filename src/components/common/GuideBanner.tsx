interface GuideBannerProps {
  itemName: string;
  path: string;
  offPath: boolean;
  onStop: () => void;
}

export function GuideBanner({ itemName, path, offPath, onStop }: GuideBannerProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-100 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-amber-900">'{itemName}' 위치 안내 중</p>
        {offPath && <p className="truncate text-xs text-amber-700">{path}</p>}
      </div>
      <button
        type="button"
        onClick={onStop}
        className="h-8 shrink-0 rounded-lg px-2 text-sm font-semibold text-amber-900 underline active:opacity-70"
      >
        종료
      </button>
    </div>
  );
}
