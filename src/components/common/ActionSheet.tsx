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
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4">
        <p className="mb-3 text-center text-sm font-medium text-slate-500">{title}</p>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={opt.onSelect}
              className={`h-12 rounded-xl text-base font-medium active:opacity-80 ${
                opt.destructive ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onCancel}
            className="mt-1 h-12 rounded-xl bg-slate-900 text-base font-medium text-white active:opacity-80"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
