export interface EmojiCategory {
  key: string;
  label: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    key: 'life',
    label: '생활',
    emojis: ['🧴', '🧻', '🧹', '🧺', '🧽', '🪥', '🪒', '🧼', '🕯️', '🔑', '🧷', '🪞', '🧦', '🧣'],
  },
  {
    key: 'kitchen',
    label: '주방',
    emojis: ['🍽️', '🥄', '🍴', '🔪', '🥢', '🍳', '🫖', '☕', '🍵', '🥣', '🧊', '🧂', '🍶', '🥡'],
  },
  {
    key: 'stationery',
    label: '문구',
    emojis: ['✏️', '🖊️', '🖋️', '🖍️', '📏', '📐', '✂️', '📌', '📎', '📝', '📒', '📓', '📔', '🗂️'],
  },
  {
    key: 'tools',
    label: '공구',
    emojis: ['🔧', '🔨', '🪛', '🪚', '🔩', '⚙️', '🪜', '🧰', '🪝', '⛏️', '🪓', '🧲', '🧱', '🔗'],
  },
  {
    key: 'clothing',
    label: '의류',
    emojis: ['👕', '👖', '🧥', '👗', '👔', '👚', '🩳', '👘', '🥻', '👙', '🎽', '🧢', '👞', '👟'],
  },
  {
    key: 'electronics',
    label: '전자',
    emojis: ['📱', '💻', '⌨️', '🖱️', '🖨️', '📷', '📸', '🎥', '📺', '📻', '🔋', '🔌', '💡', '🕹️'],
  },
  {
    key: 'health',
    label: '건강',
    emojis: ['💊', '🩹', '🩺', '🌡️', '💉', '🦷', '👓', '🧪', '🚑', '🩸', '🧬', '🥽', '🦽', '🩻'],
  },
  {
    key: 'etc',
    label: '기타',
    emojis: ['📦', '🎁', '🧸', '⚽', '🎈', '🎨', '🖼️', '📚', '💼', '👜', '🎒', '🧳', '🔦', '🪣'],
  },
];
