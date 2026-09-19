import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { repository } from '@/repository';
import type { Furniture } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { useToastStore } from '@/store/toastStore';
import { useGuideStore } from '@/store/guideStore';
import { Loading } from '@/components/common/Loading';
import { ActionSheet } from '@/components/common/ActionSheet';
import { PromptDialog } from '@/components/common/PromptDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FurnitureCard } from '@/components/room/FurnitureCard';
import { compressImage, FURNITURE_IMAGE_OPTIONS } from '@/lib/compressImage';

interface RoomScreenProps {
  roomId: string;
}

type AddDialogState = { type: 'none' } | { type: 'choosePhotoSource' } | { type: 'name'; photoId: string };

type ItemDialogState =
  | { type: 'none' }
  | { type: 'menu'; furniture: Furniture }
  | { type: 'rename'; furniture: Furniture }
  | { type: 'choosePhotoSource'; furniture: Furniture }
  | { type: 'delete'; furniture: Furniture };

const GRID_BACKGROUND: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

// FurnitureCard의 실제 폭(w-24 = 96px) 기준. 카드끼리 겹치지 않을 만큼 충분히 떨어뜨린다.
const FURNITURE_CARD_SIZE_PX = 96;
const FURNITURE_CARD_GAP_PX = 16;

/**
 * 새 가구를 캔버스 중앙 부근에 배치하되, 이미 놓인 가구 수만큼 카드 크기만큼 떨어뜨려서
 * 여러 개를 놓아도 서로 겹쳐 아래 카드가 가려지고 탭이 안 되는 문제를 피한다.
 * 한 화면에 들어가는 칸을 넘어서면(9개 이상) 줄을 바꿔 계속 아래로 쌓는다(스크롤로 확인).
 */
function nextFurniturePosition(existingCount: number, containerWidthPx: number) {
  const width = Math.max(containerWidthPx, 200);
  const step = Math.min(0.3, (FURNITURE_CARD_SIZE_PX + FURNITURE_CARD_GAP_PX) / width);
  const cols = Math.max(2, Math.floor(0.9 / step));
  const col = existingCount % cols;
  const row = Math.floor(existingCount / cols);
  const offset = ((cols - 1) * step) / 2;
  return {
    x: Math.min(0.95, Math.max(0.05, 0.5 - offset + col * step)),
    y: Math.max(0.05, 0.5 - offset + row * step),
  };
}

export function RoomScreen({ roomId }: RoomScreenProps) {
  const [furnitureList, setFurnitureList] = useState<Furniture[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({});
  const [addDialog, setAddDialog] = useState<AddDialogState>({ type: 'none' });
  const [itemDialog, setItemDialog] = useState<ItemDialogState>({ type: 'none' });
  const [viewportHeight, setViewportHeight] = useState(0);

  const push = useNavigationStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);
  const guideTarget = useGuideStore((s) => s.target);

  // 스크롤 컨테이너(화면에 보이는 높이는 항상 고정). 가구 좌표(x,y 0~1)는 이 높이를 기준으로 계산해서
  // 가구가 늘어나 캔버스가 세로로 길어져도(9개 이상) 이미 놓인 가구의 위치가 밀리지 않는다.
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    // furnitureList가 null인 동안(로딩 중)에는 캔버스 자체가 아직 렌더되지 않아 ref가 비어 있다.
    // 로딩이 끝나 캔버스가 처음 그려질 때 다시 측정되도록 furnitureList를 의존성에 둔다.
    if (containerRef.current) setViewportHeight(containerRef.current.clientHeight);
  }, [furnitureList]);

  useEffect(() => {
    setFurnitureList(null);
    const unsubscribe = repository.subscribeFurniture(roomId, setFurnitureList);
    return unsubscribe;
  }, [roomId]);

  // 사진은 구독하지 않는다 — 가구 목록이 바뀔 때마다 필요한 사진만 불러온다(repository가 세션 캐시함).
  useEffect(() => {
    if (!furnitureList) return;
    let active = true;
    (async () => {
      const entries = await Promise.all(
        furnitureList.map(async (f) => {
          if (!f.photoId) return [f.id, null] as const;
          const photo = await repository.getPhoto(f.photoId);
          return [f.id, photo?.dataUrl ?? null] as const;
        }),
      );
      if (active) setPhotoUrls(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
    };
  }, [furnitureList]);

  async function handleDragEnd(id: string, x: number, y: number) {
    setFurnitureList((list) => list?.map((f) => (f.id === id ? { ...f, x, y } : f)) ?? list);
    try {
      await repository.updateFurniture(id, { x, y });
    } catch {
      showToast('위치를 저장하지 못했어요.');
      const list = await repository.listFurniture(roomId);
      setFurnitureList(list);
    }
  }

  async function handleFurniturePhotoFile(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, FURNITURE_IMAGE_OPTIONS);
      if (itemDialog.type === 'choosePhotoSource') {
        const furniture = itemDialog.furniture;
        const photo = await repository.savePhoto(roomId, dataUrl);
        const oldPhotoId = furniture.photoId;
        await repository.updateFurniture(furniture.id, { photoId: photo.id });
        if (oldPhotoId) await repository.removePhoto(oldPhotoId);
        setItemDialog({ type: 'none' });
        return;
      }
      const photo = await repository.savePhoto(roomId, dataUrl);
      setAddDialog({ type: 'name', photoId: photo.id });
    } catch {
      showToast('사진을 처리하지 못했어요. 다시 시도해주세요.');
      setAddDialog({ type: 'none' });
      setItemDialog({ type: 'none' });
    }
  }

  async function handleCreateFurniture(name: string) {
    if (addDialog.type !== 'name') return;
    try {
      const { x, y } = nextFurniturePosition(furnitureList?.length ?? 0, containerRef.current?.clientWidth ?? 390);
      await repository.createFurniture({ roomId, name, photoId: addDialog.photoId, x, y });
      setAddDialog({ type: 'none' });
    } catch {
      showToast('가구를 추가하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRename(furniture: Furniture, name: string) {
    try {
      await repository.updateFurniture(furniture.id, { name });
      setItemDialog({ type: 'none' });
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDelete(furniture: Furniture) {
    try {
      await repository.removeFurniture(furniture.id);
      setItemDialog({ type: 'none' });
      showToast('가구를 삭제했어요.');
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  if (furnitureList === null) {
    return <Loading />;
  }

  const maxY = furnitureList.reduce((max, f) => Math.max(max, f.y), 0.5);
  const canvasHeightPx = Math.max(viewportHeight, (maxY + 0.18) * viewportHeight);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full overflow-x-hidden overflow-y-auto bg-white">
        <div className="relative w-full" style={{ height: canvasHeightPx, ...GRID_BACKGROUND }}>
          {furnitureList.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-slate-400">
              아직 배치된 가구가 없어요. 오른쪽 아래 + 버튼으로 가구를 추가해보세요.
            </div>
          )}

          {furnitureList.map((f) => (
            <FurnitureCard
              key={f.id}
              furniture={f}
              photoUrl={photoUrls[f.id] ?? null}
              containerRef={containerRef}
              viewportHeightPx={viewportHeight}
              blinking={guideTarget?.roomId === roomId && guideTarget?.furnitureId === f.id}
              onTap={() => push({ type: 'furniture', furnitureId: f.id, name: f.name })}
              onDragEnd={(x, y) => handleDragEnd(f.id, x, y)}
              onLongPressSelect={() => setItemDialog({ type: 'menu', furniture: f })}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAddDialog({ type: 'choosePhotoSource' })}
        aria-label="가구 추가"
        className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg active:bg-emerald-700"
      >
        +
      </button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFurniturePhotoFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFurniturePhotoFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <ActionSheet
        open={addDialog.type === 'choosePhotoSource'}
        title="가구 사진"
        options={[
          { label: '촬영', onSelect: () => cameraInputRef.current?.click() },
          { label: '갤러리에서 가져오기', onSelect: () => galleryInputRef.current?.click() },
        ]}
        onCancel={() => setAddDialog({ type: 'none' })}
      />
      <PromptDialog
        open={addDialog.type === 'name'}
        title="가구 이름"
        placeholder="예: 서랍장"
        confirmLabel="추가"
        onConfirm={handleCreateFurniture}
        onCancel={() => setAddDialog({ type: 'none' })}
      />

      <ActionSheet
        open={itemDialog.type === 'menu'}
        title={itemDialog.type === 'menu' ? itemDialog.furniture.name : ''}
        options={[
          {
            label: '이름 변경',
            onSelect: () =>
              itemDialog.type === 'menu' && setItemDialog({ type: 'rename', furniture: itemDialog.furniture }),
          },
          {
            label: '사진 변경',
            onSelect: () =>
              itemDialog.type === 'menu' &&
              setItemDialog({ type: 'choosePhotoSource', furniture: itemDialog.furniture }),
          },
          {
            label: '삭제',
            destructive: true,
            onSelect: () =>
              itemDialog.type === 'menu' && setItemDialog({ type: 'delete', furniture: itemDialog.furniture }),
          },
        ]}
        onCancel={() => setItemDialog({ type: 'none' })}
      />
      <PromptDialog
        open={itemDialog.type === 'rename'}
        title="가구 이름 수정"
        initialValue={itemDialog.type === 'rename' ? itemDialog.furniture.name : ''}
        confirmLabel="저장"
        onConfirm={(name) => itemDialog.type === 'rename' && handleRename(itemDialog.furniture, name)}
        onCancel={() => setItemDialog({ type: 'none' })}
      />
      <ActionSheet
        open={itemDialog.type === 'choosePhotoSource'}
        title="사진 선택"
        options={[
          { label: '촬영', onSelect: () => cameraInputRef.current?.click() },
          { label: '갤러리에서 가져오기', onSelect: () => galleryInputRef.current?.click() },
        ]}
        onCancel={() => setItemDialog({ type: 'none' })}
      />
      <ConfirmDialog
        open={itemDialog.type === 'delete'}
        title="이 가구를 삭제할까요?"
        description="이 가구의 모든 보관함·물건이 함께 삭제돼요."
        confirmLabel="삭제"
        danger
        onConfirm={() => itemDialog.type === 'delete' && handleDelete(itemDialog.furniture)}
        onCancel={() => setItemDialog({ type: 'none' })}
      />
    </div>
  );
}
