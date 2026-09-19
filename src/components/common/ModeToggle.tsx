/**
 * 도면·가구 사진 화면의 보기/편집 토글. 상태(mode)와 모드가 바뀔 때 하는 일(초기화 등)은
 * 화면이 그대로 갖고 있고, 이 컴포넌트는 받은 onChange를 그대로 호출해 보여주기만 한다.
 */
interface ModeToggleProps {
  mode: 'view' | 'edit';
  onChange: (mode: 'view' | 'edit') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('view')}
        className={`flex h-12 items-center justify-center rounded-full border px-4 text-lg font-medium ${
          mode === 'view' ? 'border-navy bg-soft text-navy' : 'border-line bg-white text-ink-sub'
        }`}
      >
        보기
      </button>
      <button
        type="button"
        onClick={() => onChange('edit')}
        className={`flex h-12 items-center justify-center rounded-full border px-4 text-lg font-medium ${
          mode === 'edit' ? 'border-navy bg-soft text-navy' : 'border-line bg-white text-ink-sub'
        }`}
      >
        편집
      </button>
    </div>
  );
}
