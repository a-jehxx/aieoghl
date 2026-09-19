interface LoadingProps {
  label?: string;
}

export function Loading({ label = '불러오는 중...' }: LoadingProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <svg className="h-8 w-8 animate-spin text-navy" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="opacity-75"
        />
      </svg>
      <p className="text-sm text-ink-sub">{label}</p>
    </div>
  );
}
