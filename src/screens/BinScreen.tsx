import { useEffect, useRef, useState } from 'react';
import { repository } from '@/repository';
import type { Item } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionSheet } from '@/components/common/ActionSheet';
import { PromptDialog } from '@/components/common/PromptDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmojiPickerSheet } from '@/components/common/EmojiPickerSheet';
import { compressImage, ITEM_IMAGE_OPTIONS } from '@/lib/compressImage';

interface BinScreenProps {
  binId: string;
}

type AddDialogState =
  | { type: 'none' }
  | { type: 'chooseType' }
  | { type: 'choosePhotoSource' }
  | { type: 'chooseEmoji' }
  | { type: 'name'; photoId?: string; emoji?: string };

type EditDialogState =
  | { type: 'none' }
  | { type: 'panel'; item: Item }
  | { type: 'rename'; item: Item }
  | { type: 'choosePhotoSource'; item: Item }
  | { type: 'chooseEmoji'; item: Item }
  | { type: 'delete'; item: Item };

export function BinScreen({ binId }: BinScreenProps) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({});
  const [addDialog, setAddDialog] = useState<AddDialogState>({ type: 'none' });
  const [editDialog, setEditDialog] = useState<EditDialogState>({ type: 'none' });

  const showToast = useToastStore((s) => s.show);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const list = await repository.listItems(binId);
    setItems(list);
    const entries = await Promise.all(
      list.map(async (item) => {
        if (!item.photoId) return [item.id, null] as const;
        const photo = await repository.getPhoto(item.photoId);
        return [item.id, photo?.dataUrl ?? null] as const;
      }),
    );
    setPhotoUrls(Object.fromEntries(entries));
  }

  useEffect(() => {
    setItems(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binId]);

  async function handlePhotoFile(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, ITEM_IMAGE_OPTIONS);
      if (addDialog.type === 'choosePhotoSource') {
        const photo = await repository.savePhoto(dataUrl);
        setAddDialog({ type: 'name', photoId: photo.id });
      } else if (editDialog.type === 'choosePhotoSource') {
        const item = editDialog.item;
        const photo = await repository.savePhoto(dataUrl);
        const oldPhotoId = item.photoId;
        await repository.updateItem(item.id, { photoId: photo.id, emoji: undefined });
        if (oldPhotoId) await repository.removePhoto(oldPhotoId);
        setEditDialog({ type: 'none' });
        await refresh();
      }
    } catch {
      showToast('사진을 처리하지 못했어요. 다시 시도해주세요.');
      setAddDialog({ type: 'none' });
      setEditDialog({ type: 'none' });
    }
  }

  async function handleCreateItem(name: string) {
    if (addDialog.type !== 'name') return;
    try {
      await repository.createItem({ binId, name, photoId: addDialog.photoId, emoji: addDialog.emoji });
      setAddDialog({ type: 'none' });
      await refresh();
    } catch {
      showToast('물건을 추가하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRename(item: Item, name: string) {
    try {
      await repository.updateItem(item.id, { name });
      setEditDialog({ type: 'none' });
      await refresh();
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleChangeEmoji(item: Item, emoji: string) {
    try {
      const oldPhotoId = item.photoId;
      await repository.updateItem(item.id, { emoji, photoId: null });
      if (oldPhotoId) await repository.removePhoto(oldPhotoId);
      setEditDialog({ type: 'none' });
      await refresh();
    } catch {
      showToast('변경하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDelete(item: Item) {
    try {
      await repository.removeItem(item.id);
      setEditDialog({ type: 'none' });
      showToast('물건을 삭제했어요.');
      await refresh();
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  if (items === null) {
    return <Loading />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <button
        type="button"
        onClick={() => setAddDialog({ type: 'chooseType' })}
        className="mb-3 flex h-14 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-base font-medium text-slate-500 active:bg-slate-100"
      >
        + 물건 추가
      </button>

      {items.length === 0 ? (
        <EmptyState title="아직 담긴 물건이 없어요" description="사진이나 이모티콘으로 물건을 추가해보세요." />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setEditDialog({ type: 'panel', item })}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm active:bg-slate-50"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {item.photoId && photoUrls[item.id] ? (
                  <img src={photoUrls[item.id]!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">{item.emoji ?? '📦'}</span>
                )}
              </div>
              <p className="w-full truncate text-center text-xs font-medium text-slate-900">{item.name}</p>
            </button>
          ))}
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handlePhotoFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handlePhotoFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <ActionSheet
        open={addDialog.type === 'chooseType'}
        title="물건 추가"
        options={[
          { label: '사진으로 담기', onSelect: () => setAddDialog({ type: 'choosePhotoSource' }) },
          { label: '이모티콘으로 담기', onSelect: () => setAddDialog({ type: 'chooseEmoji' }) },
        ]}
        onCancel={() => setAddDialog({ type: 'none' })}
      />
      <ActionSheet
        open={addDialog.type === 'choosePhotoSource'}
        title="사진 선택"
        options={[
          { label: '촬영', onSelect: () => cameraInputRef.current?.click() },
          { label: '갤러리에서 가져오기', onSelect: () => galleryInputRef.current?.click() },
        ]}
        onCancel={() => setAddDialog({ type: 'none' })}
      />
      <EmojiPickerSheet
        open={addDialog.type === 'chooseEmoji'}
        onSelect={(emoji) => setAddDialog({ type: 'name', emoji })}
        onCancel={() => setAddDialog({ type: 'none' })}
      />
      <PromptDialog
        open={addDialog.type === 'name'}
        title="물건 이름"
        placeholder="예: 볼펜심"
        confirmLabel="담기"
        onConfirm={handleCreateItem}
        onCancel={() => setAddDialog({ type: 'none' })}
      />

      {editDialog.type === 'panel' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {editDialog.item.photoId && photoUrls[editDialog.item.id] ? (
                  <img src={photoUrls[editDialog.item.id]!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl">{editDialog.item.emoji ?? '📦'}</span>
                )}
              </div>
              <p className="text-lg font-semibold text-slate-900">{editDialog.item.name}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setEditDialog({ type: 'rename', item: editDialog.item })}
                className="h-12 rounded-xl bg-slate-100 text-base font-medium text-slate-900 active:bg-slate-200"
              >
                이름 변경
              </button>
              <button
                type="button"
                onClick={() => setEditDialog({ type: 'choosePhotoSource', item: editDialog.item })}
                className="h-12 rounded-xl bg-slate-100 text-base font-medium text-slate-900 active:bg-slate-200"
              >
                사진으로 바꾸기
              </button>
              <button
                type="button"
                onClick={() => setEditDialog({ type: 'chooseEmoji', item: editDialog.item })}
                className="h-12 rounded-xl bg-slate-100 text-base font-medium text-slate-900 active:bg-slate-200"
              >
                이모티콘으로 바꾸기
              </button>
              <button
                type="button"
                onClick={() => setEditDialog({ type: 'delete', item: editDialog.item })}
                className="h-12 rounded-xl bg-red-50 text-base font-medium text-red-600 active:bg-red-100"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={() => setEditDialog({ type: 'none' })}
                className="mt-1 h-12 rounded-xl bg-slate-900 text-base font-medium text-white active:opacity-80"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <PromptDialog
        open={editDialog.type === 'rename'}
        title="이름 수정"
        initialValue={editDialog.type === 'rename' ? editDialog.item.name : ''}
        confirmLabel="저장"
        onConfirm={(name) => editDialog.type === 'rename' && handleRename(editDialog.item, name)}
        onCancel={() => setEditDialog({ type: 'none' })}
      />
      <ActionSheet
        open={editDialog.type === 'choosePhotoSource'}
        title="사진 선택"
        options={[
          { label: '촬영', onSelect: () => cameraInputRef.current?.click() },
          { label: '갤러리에서 가져오기', onSelect: () => galleryInputRef.current?.click() },
        ]}
        onCancel={() => setEditDialog({ type: 'none' })}
      />
      <EmojiPickerSheet
        open={editDialog.type === 'chooseEmoji'}
        onSelect={(emoji) => editDialog.type === 'chooseEmoji' && handleChangeEmoji(editDialog.item, emoji)}
        onCancel={() => setEditDialog({ type: 'none' })}
      />
      <ConfirmDialog
        open={editDialog.type === 'delete'}
        title="이 물건을 삭제할까요?"
        confirmLabel="삭제"
        danger
        onConfirm={() => editDialog.type === 'delete' && handleDelete(editDialog.item)}
        onCancel={() => setEditDialog({ type: 'none' })}
      />
    </div>
  );
}
