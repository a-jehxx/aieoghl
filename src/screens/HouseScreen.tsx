import { useEffect, useState } from 'react';
import { repository } from '@/repository';
import type { Floor } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { useToastStore } from '@/store/toastStore';
import { Loading } from '@/components/common/Loading';
import { PromptDialog } from '@/components/common/PromptDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface HouseScreenProps {
  houseId: string;
  houseName: string;
}

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'rename'; floor: Floor }
  | { type: 'delete'; floor: Floor };

export function HouseScreen({ houseId, houseName }: HouseScreenProps) {
  const [floors, setFloors] = useState<Floor[] | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const push = useNavigationStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    const unsubscribe = repository.subscribeFloors(houseId, (list) => {
      const sorted = [...list].sort((a, b) => a.order - b.order);
      setFloors(sorted);
    });
    return unsubscribe;
  }, [houseId]);

  function openFloor(floor: Floor) {
    push({ type: 'floor', floorId: floor.id, name: floor.name, houseId, houseName });
  }

  async function handleCreate(name: string) {
    try {
      const order = floors?.length ?? 0;
      await repository.createFloor({ houseId, name, order, planPhotoId: null });
      setDialog({ type: 'none' });
    } catch {
      showToast('층을 만들지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRename(floor: Floor, name: string) {
    try {
      await repository.updateFloor(floor.id, { name });
      setDialog({ type: 'none' });
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDelete(floor: Floor) {
    try {
      await repository.removeFloor(floor.id);
      setDialog({ type: 'none' });
      showToast('층을 삭제했어요.');
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  if (floors === null) {
    return <Loading />;
  }

  const canDelete = floors.length > 1;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <button
        type="button"
        onClick={() => setDialog({ type: 'create' })}
        className="mb-3 flex h-14 w-full items-center justify-center rounded-full border-2 border-dashed border-soft-line text-lg font-medium text-ink-sub active:bg-soft"
      >
        ➕ 층 추가
      </button>

      <ul className="flex flex-col gap-2">
        {floors.map((floor) => (
          <li
            key={floor.id}
            className="flex flex-col rounded-3xl border border-line bg-white"
          >
            <button
              type="button"
              onClick={() => openFloor(floor)}
              className="flex h-16 flex-1 items-center px-4 text-left text-lg font-medium text-ink active:bg-bg"
            >
              {floor.name}
            </button>
            <div className="flex items-center gap-1 border-t border-line px-2 py-1">
              <button
                type="button"
                onClick={() => setDialog({ type: 'rename', floor })}
                className="flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium text-ink active:bg-bg"
              >
                ✏️ 수정
              </button>
              <button
                type="button"
                disabled={!canDelete}
                onClick={() => setDialog({ type: 'delete', floor })}
                className="flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium text-danger active:bg-danger/10 disabled:opacity-30"
              >
                🗑️ 삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <PromptDialog
        open={dialog.type === 'create'}
        title="층 추가"
        placeholder="예: 2층"
        confirmLabel="추가"
        onConfirm={handleCreate}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <PromptDialog
        open={dialog.type === 'rename'}
        title="층 이름 수정"
        initialValue={dialog.type === 'rename' ? dialog.floor.name : ''}
        confirmLabel="저장"
        onConfirm={(name) => dialog.type === 'rename' && handleRename(dialog.floor, name)}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <ConfirmDialog
        open={dialog.type === 'delete'}
        title="이 층을 삭제할까요?"
        description="이 층의 모든 방·가구·보관함·물건이 함께 삭제돼요."
        confirmLabel="삭제"
        danger
        onConfirm={() => dialog.type === 'delete' && handleDelete(dialog.floor)}
        onCancel={() => setDialog({ type: 'none' })}
      />
    </div>
  );
}
