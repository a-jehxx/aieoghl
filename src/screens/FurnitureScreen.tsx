import { useEffect, useState } from 'react';
import { repository } from '@/repository';
import type { Bin, Furniture } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { useToastStore } from '@/store/toastStore';
import { useGuideStore } from '@/store/guideStore';
import { Loading } from '@/components/common/Loading';
import { PromptDialog } from '@/components/common/PromptDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SelectedItemBar } from '@/components/common/SelectedItemBar';
import { PhotoCanvas } from '@/components/photo/PhotoCanvas';

interface FurnitureScreenProps {
  furnitureId: string;
}

type Mode = 'view' | 'edit';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LiveRect extends Rect {
  id: string;
}

type DialogState =
  | { type: 'none' }
  | { type: 'nameNewBin' }
  | { type: 'renameBin'; bin: Bin }
  | { type: 'deleteBin'; bin: Bin };

const DEFAULT_BIN_W = 0.3;
const DEFAULT_BIN_H = 0.22;
const MIN_BIN_SIZE = 0.04;

function clampRect(r: Rect): Rect {
  let { x, y, w, h } = r;
  w = Math.max(MIN_BIN_SIZE, w);
  h = Math.max(MIN_BIN_SIZE, h);
  x = Math.min(Math.max(x, 0), 1 - w);
  y = Math.min(Math.max(y, 0), 1 - h);
  return { x, y, w, h };
}

export function FurnitureScreen({ furnitureId }: FurnitureScreenProps) {
  const [furniture, setFurniture] = useState<Furniture | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [liveRect, setLiveRect] = useState<LiveRect | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });

  const push = useNavigationStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);
  const guideTarget = useGuideStore((s) => s.target);

  async function loadAll() {
    setLoading(true);
    const f = await repository.getFurniture(furnitureId);
    setFurniture(f ?? null);
    const binList = await repository.listBins(furnitureId);
    setBins(binList);
    if (f?.photoId) {
      const photo = await repository.getPhoto(f.photoId);
      setPhotoUrl(photo?.dataUrl ?? null);
    } else {
      setPhotoUrl(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    setMode('view');
    setSelectedBinId(null);
    setLiveRect(null);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [furnitureId]);

  function setModeTo(target: Mode) {
    if (target === mode) return;
    setMode(target);
    setSelectedBinId(null);
    setLiveRect(null);
  }

  async function handleCreateBin(name: string) {
    try {
      const w = DEFAULT_BIN_W;
      const h = DEFAULT_BIN_H;
      const bin = await repository.createBin({
        furnitureId,
        name,
        x: 0.5 - w / 2,
        y: 0.5 - h / 2,
        w,
        h,
      });
      setDialog({ type: 'none' });
      const binList = await repository.listBins(furnitureId);
      setBins(binList);
      setSelectedBinId(bin.id);
    } catch {
      showToast('보관함을 추가하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRenameBin(bin: Bin, name: string) {
    try {
      await repository.updateBin(bin.id, { name });
      setDialog({ type: 'none' });
      const binList = await repository.listBins(furnitureId);
      setBins(binList);
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDeleteBin(bin: Bin) {
    try {
      await repository.removeBin(bin.id);
      setDialog({ type: 'none' });
      setSelectedBinId(null);
      showToast('보관함을 삭제했어요.');
      const binList = await repository.listBins(furnitureId);
      setBins(binList);
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  function handleTapHit(hitId: string) {
    const bin = bins.find((b) => b.id === hitId);
    if (!bin) return;
    if (mode === 'view') {
      push({ type: 'bin', binId: bin.id, name: bin.name });
    } else {
      setSelectedBinId(bin.id);
    }
  }

  function handleEmptyTap() {
    if (mode === 'edit' && selectedBinId) {
      setSelectedBinId(null);
    }
  }

  function baseRectFor(id: string): Rect | null {
    if (liveRect && liveRect.id === id) return liveRect;
    const bin = bins.find((b) => b.id === id);
    return bin ? { x: bin.x, y: bin.y, w: bin.w, h: bin.h } : null;
  }

  function handleItemMove(id: string, dx: number, dy: number) {
    const base = baseRectFor(id);
    if (!base) return;
    const next = clampRect({ ...base, x: base.x + dx, y: base.y + dy });
    setLiveRect({ id, ...next });
  }

  function handleItemMoveEnd(id: string) {
    setSelectedBinId(id);
    setLiveRect((prev) => {
      if (prev && prev.id === id) {
        const { x, y } = prev;
        repository
          .updateBin(id, { x, y })
          .then(() => setBins((list) => list.map((b) => (b.id === id ? { ...b, x, y } : b))))
          .catch(() => showToast('위치를 저장하지 못했어요.'));
      }
      return null;
    });
  }

  function handleHandleDrag(handleId: string, dx: number, dy: number) {
    const [id, corner] = handleId.split(':');
    const base = baseRectFor(id);
    if (!base) return;
    let { x, y, w, h } = base;
    if (corner.includes('l')) {
      x += dx;
      w -= dx;
    }
    if (corner.includes('r')) {
      w += dx;
    }
    if (corner.includes('t')) {
      y += dy;
      h -= dy;
    }
    if (corner.includes('b')) {
      h += dy;
    }
    setLiveRect({ id, ...clampRect({ x, y, w, h }) });
  }

  function handleHandleDragEnd(handleId: string) {
    const [id] = handleId.split(':');
    setLiveRect((prev) => {
      if (prev && prev.id === id) {
        const { x, y, w, h } = prev;
        repository
          .updateBin(id, { x, y, w, h })
          .then(() => setBins((list) => list.map((b) => (b.id === id ? { ...b, x, y, w, h } : b))))
          .catch(() => showToast('크기를 저장하지 못했어요.'));
      }
      return null;
    });
  }

  if (loading) {
    return <Loading />;
  }

  if (!furniture || !photoUrl) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
        가구 사진을 찾을 수 없어요.
      </div>
    );
  }

  const selectedBin = bins.find((b) => b.id === selectedBinId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          <button
            type="button"
            onClick={() => setModeTo('view')}
            className={`h-9 px-3 text-sm font-medium ${
              mode === 'view' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            보기
          </button>
          <button
            type="button"
            onClick={() => setModeTo('edit')}
            className={`h-9 px-3 text-sm font-medium ${
              mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            편집
          </button>
        </div>
      </div>

      {/* min-h-0: flex 자식은 기본적으로 내용(세로로 긴 사진)만큼 커지려 해서 화면보다 커질 수 있다.
          이게 없으면 사진이 길 때 이 영역이 뷰포트를 넘어가 아래쪽 + 버튼이 화면 밖으로 밀려난다. */}
      <div className="relative min-h-0 flex-1">
        <PhotoCanvas
          imageUrl={photoUrl}
          resetKey={furnitureId}
          editable={mode === 'edit'}
          onTapHit={handleTapHit}
          onEmptyTap={handleEmptyTap}
          onItemMove={handleItemMove}
          onItemMoveEnd={handleItemMoveEnd}
          onHandleDrag={handleHandleDrag}
          onHandleDragEnd={handleHandleDragEnd}
          overlay={
            <>
              {bins.map((bin) => {
                const rect = (liveRect && liveRect.id === bin.id ? liveRect : bin) as Rect;
                const isSelected = selectedBinId === bin.id;
                const blinking = guideTarget?.furnitureId === furnitureId && guideTarget?.binId === bin.id;
                return (
                  <g key={bin.id}>
                    <rect
                      data-hit-id={bin.id}
                      x={rect.x * 100}
                      y={rect.y * 100}
                      width={rect.w * 100}
                      height={rect.h * 100}
                      className={
                        blinking
                          ? 'hsm-blink-shape'
                          : isSelected
                            ? 'fill-orange-500/40 stroke-orange-700'
                            : 'fill-orange-500/25 stroke-orange-600'
                      }
                      strokeWidth={0.6}
                    />
                    {mode === 'edit' && isSelected && (
                      <>
                        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
                          const hx = rect.x + (corner.includes('r') ? rect.w : 0);
                          const hy = rect.y + (corner.includes('b') ? rect.h : 0);
                          return (
                            <circle
                              key={corner}
                              data-handle-id={`${bin.id}:${corner}`}
                              cx={hx * 100}
                              cy={hy * 100}
                              r={2}
                              className="fill-white stroke-orange-700"
                              strokeWidth={0.6}
                            />
                          );
                        })}
                      </>
                    )}
                  </g>
                );
              })}
            </>
          }
        />

        {mode === 'edit' && !selectedBinId && (
          <button
            type="button"
            onClick={() => setDialog({ type: 'nameNewBin' })}
            aria-label="보관함 추가"
            className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-2xl text-white shadow-lg active:bg-orange-700"
          >
            +
          </button>
        )}

        {mode === 'edit' && selectedBin && (
          <SelectedItemBar
            label={selectedBin.name}
            onRename={() => setDialog({ type: 'renameBin', bin: selectedBin })}
            onDelete={() => setDialog({ type: 'deleteBin', bin: selectedBin })}
            onClose={() => setSelectedBinId(null)}
          />
        )}
      </div>

      <PromptDialog
        open={dialog.type === 'nameNewBin'}
        title="보관함 이름"
        placeholder="예: 문구함"
        confirmLabel="추가"
        onConfirm={handleCreateBin}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <PromptDialog
        open={dialog.type === 'renameBin'}
        title="보관함 이름 수정"
        initialValue={dialog.type === 'renameBin' ? dialog.bin.name : ''}
        confirmLabel="저장"
        onConfirm={(name) => dialog.type === 'renameBin' && handleRenameBin(dialog.bin, name)}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <ConfirmDialog
        open={dialog.type === 'deleteBin'}
        title="이 보관함을 삭제할까요?"
        description="이 보관함의 모든 물건이 함께 삭제돼요."
        confirmLabel="삭제"
        danger
        onConfirm={() => dialog.type === 'deleteBin' && handleDeleteBin(dialog.bin)}
        onCancel={() => setDialog({ type: 'none' })}
      />
    </div>
  );
}
