interface SelectedItemBarProps {
  label: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SelectedItemBar({ label, onRename, onDelete, onClose }: SelectedItemBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-card/95 p-3">
      <p className="flex-1 truncate text-[15px] font-medium text-ink">{label}</p>
      <button
        type="button"
        onClick={onRename}
        className="h-12 rounded-full border border-line bg-white px-4 text-[15px] font-medium text-ink active:bg-bg"
      >
        이름 변경
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="h-12 rounded-full border border-danger/30 bg-white px-4 text-[15px] font-medium text-danger active:bg-danger/10"
      >
        🗑️ 삭제
      </button>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex h-12 shrink-0 items-center justify-center rounded-full px-2 text-[15px] text-ink-sub active:bg-bg"
      >
        닫기 ✕
      </button>
    </div>
  );
}
