import { useEffect } from 'react';
import { useToastStore } from '@/store/toastStore';

export function Toast() {
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2500);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
      <div
        role="status"
        onClick={hide}
        className="pointer-events-auto max-w-sm rounded-full bg-ink/90 px-5 py-3 text-center text-[15px] text-white"
      >
        {message}
      </div>
    </div>
  );
}
