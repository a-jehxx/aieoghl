/** "촬영"/"갤러리에서 가져오기"는 여러 화면(도면·가구·물건 사진)에서 똑같이 재사용되는
 * ActionSheet 옵션 라벨이라, 이모티콘을 한 곳에서만 붙이도록 여기 모아둔다. */
export const CAMERA_LABEL = '📷 촬영';
export const GALLERY_LABEL = '🖼️ 갤러리에서 가져오기';

interface ActionSheetOption {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  title: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  onCancel: () => void;
}

export function ActionSheet({ open, title, options, cancelLabel = '취소', onCancel }: ActionSheetProps) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-t-[32px] bg-card p-4">
        <p className="mb-3 text-center text-[15px] font-medium text-ink-sub">{title}</p>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.onSelect}
              className={`h-12 rounded-full border border-line bg-white text-lg font-medium active:bg-bg ${
                opt.destructive ? 'text-danger' : 'text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onCancel}
            className="mt-1 h-12 rounded-full bg-navy text-lg font-medium text-white active:opacity-80"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
