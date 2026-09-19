interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="text-slate-300">
        <path
          d="M3 10.5 12 4l9 6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 h-11 rounded-xl bg-blue-600 px-5 text-base font-medium text-white active:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
