import { useEffect, useState } from 'react';
import { EMOJI_CATEGORIES } from '@/lib/emojiCatalog';

interface EmojiPickerSheetProps {
  open: boolean;
  onSelect: (emoji: string) => void;
  onCancel: () => void;
}

export function EmojiPickerSheet({ open, onSelect, onCancel }: EmojiPickerSheetProps) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].key);

  useEffect(() => {
    if (open) setActiveCategory(EMOJI_CATEGORIES[0].key);
  }, [open]);

  if (!open) return null;

  const category = EMOJI_CATEGORIES.find((c) => c.key === activeCategory) ?? EMOJI_CATEGORIES[0];

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-3">
        <p className="text-lg font-semibold text-slate-900">이모티콘 선택</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="닫기"
          className="flex h-11 w-11 items-center justify-center text-xl text-slate-500"
        >
          ✕
        </button>
      </div>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-2 py-2">
        {EMOJI_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveCategory(c.key)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium ${
              c.key === activeCategory ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-5 gap-2 overflow-y-auto p-4">
        {category.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex h-14 items-center justify-center rounded-xl text-3xl active:bg-slate-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
