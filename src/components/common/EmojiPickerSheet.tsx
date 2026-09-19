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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-card">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3">
        <p className="text-lg font-bold text-ink">이모티콘 선택</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="닫기"
          className="flex h-12 shrink-0 items-center justify-center rounded-full px-2 text-[15px] text-ink-sub active:bg-bg"
        >
          닫기 ✕
        </button>
      </div>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-2 py-2">
        {EMOJI_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveCategory(c.key)}
            className={`h-11 shrink-0 rounded-full border px-4 text-[15px] font-medium ${
              c.key === activeCategory ? 'border-navy bg-soft text-navy' : 'border-line bg-white text-ink-sub'
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
            className="flex h-14 items-center justify-center rounded-xl text-3xl active:bg-bg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
