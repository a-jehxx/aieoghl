interface EmptyStateAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actions?: EmptyStateAction[];
}

export function EmptyState({ title, description, actionLabel, onAction, actions }: EmptyStateProps) {
  const resolvedActions: EmptyStateAction[] =
    actions ?? (actionLabel && onAction ? [{ label: actionLabel, onClick: onAction, primary: true }] : []);

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
      {resolvedActions.length > 0 && (
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
          {resolvedActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={
                action.primary
                  ? 'h-11 rounded-xl bg-blue-600 px-5 text-base font-medium text-white active:bg-blue-700'
                  : 'h-11 rounded-xl bg-slate-100 px-5 text-base font-medium text-slate-700 active:bg-slate-200'
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
