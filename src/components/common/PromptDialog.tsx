import { useEffect, useRef, useState } from 'react';

interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  description,
  placeholder,
  initialValue = '',
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open, initialValue]);

  if (!open) return null;

  const trimmed = value.trim();

  function handleConfirm() {
    // 한글 등 조합 입력 중에는 React state(value)가 화면에 보이는 글자보다
    // 한 박자 늦게 갱신될 수 있다. 버튼을 눌렀을 때는 항상 DOM에 실제로 입력된
    // 값을 직접 읽어서 판단한다(비활성화 상태 때문에 탭이 아예 씹히는 일을 막는다).
    const current = (inputRef.current?.value ?? value).trim();
    if (!current) return;
    onConfirm(current);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
          placeholder={placeholder}
          className="mt-4 h-12 w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none"
        />
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl bg-slate-100 text-base font-medium text-slate-700 active:bg-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`h-11 flex-1 rounded-xl bg-blue-600 text-base font-medium text-white active:bg-blue-700 ${
              trimmed ? '' : 'opacity-40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
