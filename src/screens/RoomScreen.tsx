import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  | { type: 'delete'; furniture: Furniture };

const GRID_BACKGROUND: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

export function RoomScreen({ roomId }: RoomScreenProps) {
  const [furnitureList, setFurnitureList] = useState<Furniture[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({});
  const [addDialog, setAddDialog] = useState<AddDialogState>({ type: 'none' });
  const [itemDialog, setItemDialog] = useState<ItemDialogState>({ type: 'none' });

  const push = useNavigationStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);
  const guideTarget = useGuideStore((s) => s.target);

  const containerRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const list = await repository.listFurniture(roomId);
    setFurnitureList(list);
    const entries = await Promise.all(
      list.map(async (f) => {
        if (!f.photoId) return [f.id, null] as const;
        const photo = await repository.getPhoto(f.photoId);
        return [f.id, photo?.dataUrl ?? null] as const;
      }),
    );
    setPhotoUrls(Object.fromEntries(entries));
  }

  useEffect(() => {
    setFurnitureList(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function handleDragEnd(id: string, x: number, y: number) {
    setFurnitureList((list) => list?.map((f) => (f.id === id ? { ...f, x, y } : f)) ?? list);
    try {
      await repository.updateFurniture(id, { x, y });
    } catch {
      showToast('위치를 저장하지 못했어요.');
      await refresh();
    }
  }

  async function handleFurniturePhotoFile(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, FURNITURE_IMAGE_OPTIONS);
      const photo = await repository.savePhoto(dataUrl);
      setAddDialog({ type: 'name', photoId: photo.id });
    } catch {
      showToast('사진을 처리하지 못했어요. 다시 시도해주세요.');
      setAddDialog({ type: 'none' });
    }
  }

  async function handleCreateFurniture(name: string) {
    if (addDialog.type !== 'name') return;
    try {
      await repository.createFurniture({ roomId, name, photoId: addDialog.photoId, x: 0.5, y: 0.5 });
      setAddDialog({ type: 'none' });
      await refresh();
    } catch {
      showToast('가구를 추가하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRename(furniture: Furniture, name: string) {
    try {
      await repository.updateFurniture(furniture.id, { name });
      setItemDialog({ type: 'none' });
      await refresh();
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDelete(furniture: Furniture) {
    try {
      await repository.removeFurniture(furniture.id);
      setItemDialog({ type: 'none' });
      showToast('가구를 삭제했어요.');
      await refresh();
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  if (furnitureList === null) {
    return <Loading />;
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-white" style={GRID_BACKGROUND}>
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
          blinking={guideTarget?.roomId === roomId && guideTarget?.furnitureId === f.id}
          onTap={() => push({ type: 'furniture', furnitureId: f.id, name: f.name })}
          onDragEnd={(x, y) => handleDragEnd(f.id, x, y)}
          onLongPressSelect={() => setItemDialog({ type: 'menu', furniture: f })}
        />
      ))}

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
