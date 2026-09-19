interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="w-full max-w-sm rounded-t-xl bg-card p-5 sm:rounded-xl">
        <p className="text-lg font-semibold text-ink">{title}</p>
        {description && <p className="mt-2 text-sm text-ink-sub">{description}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-[10px] border border-line bg-white text-base font-medium text-ink active:bg-bg"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-11 flex-1 rounded-[10px] text-base font-medium ${
              danger
                ? 'border border-line bg-white text-danger active:bg-danger/10'
                : 'bg-navy text-white active:opacity-80'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
