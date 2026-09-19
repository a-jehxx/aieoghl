interface SelectedItemBarProps {
  label: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SelectedItemBar({ label, onRename, onDelete, onClose }: SelectedItemBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-white/95 p-3">
      <p className="flex-1 truncate text-sm font-medium text-slate-900">{label}</p>
      <button
        type="button"
        onClick={onRename}
        className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-700 active:bg-slate-200"
      >
        이름 변경
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="h-11 rounded-xl bg-red-500 px-4 text-sm font-medium text-white active:bg-red-600"
      >
        삭제
      </button>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex h-11 w-11 items-center justify-center text-lg text-slate-500"
      >
        ✕
      </button>
    </div>
  );
}
