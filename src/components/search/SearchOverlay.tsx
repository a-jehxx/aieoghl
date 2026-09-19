import { useEffect, useRef, useState } from 'react';
import { searchItemsInHouse, formatLocationPath, type SearchResult } from '@/lib/search';
import { useNavigationStore } from '@/store/navigationStore';
import { useGuideStore } from '@/store/guideStore';
import { EmptyState } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';

interface SearchOverlayProps {
  open: boolean;
  houseId: string | null;
  houseName: string;
  onClose: () => void;
}

export function SearchOverlay({ open, houseId, houseName, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = useNavigationStore((s) => s.push);
  const startGuide = useGuideStore((s) => s.start);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults(null);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || !houseId) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    let active = true;
    searchItemsInHouse(houseId, trimmed).then((list) => {
      if (active) setResults(list);
    });
    return () => {
      active = false;
    };
  }, [open, houseId, query]);

  if (!open || !houseId) return null;

  function handleSelect(r: SearchResult) {
    startGuide({
      itemId: r.item.id,
      itemName: r.item.name,
      floorId: r.floorId,
      floorName: r.floorName,
      roomId: r.roomId,
      roomName: r.roomName,
      furnitureId: r.furnitureId,
      furnitureName: r.furnitureName,
      binId: r.binId,
      binName: r.binName,
    });
    push({ type: 'floor', floorId: r.floorId, name: r.floorName, houseId: houseId!, houseName });
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-2xl text-slate-700"
        >
          ←
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="물건 이름으로 검색"
          className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {query.trim() === '' && (
          <p className="mt-8 text-center text-sm text-slate-400">찾고 싶은 물건 이름을 입력해보세요.</p>
        )}
        {query.trim() !== '' && results === null && <Loading label="찾는 중..." />}
        {query.trim() !== '' && results !== null && results.length === 0 && (
          <EmptyState title="찾는 물건이 없어요" description="물건을 등록하면 여기서 검색할 수 있어요." />
        )}
        {results && results.length > 0 && (
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left active:bg-slate-50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {r.photoUrl ? (
                      <img src={r.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">{r.item.emoji ?? '📦'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-slate-900">{r.item.name}</p>
                    <p className="truncate text-xs text-slate-500">{formatLocationPath(r)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
