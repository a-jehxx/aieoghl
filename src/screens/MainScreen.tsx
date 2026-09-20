import { useEffect, useState } from 'react';
import { repository } from '@/repository';
import type { House } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { useToastStore } from '@/store/toastStore';
import { useDemoStore } from '@/store/demoStore';
import { EmptyState } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';
import { PromptDialog } from '@/components/common/PromptDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getOwnerUid } from '@/lib/ownerUid';

type DialogState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'join' }
  | { type: 'rename'; house: House }
  | { type: 'delete'; house: House };

export function MainScreen() {
  const [houses, setHouses] = useState<House[] | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const push = useNavigationStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);
  const enterDemo = useDemoStore((s) => s.enter);
  const demoStarting = useDemoStore((s) => s.starting);

  useEffect(() => {
    const unsubscribe = repository.subscribeHouses(setHouses);
    return unsubscribe;
  }, []);

  async function openHouse(house: House) {
    const floors = await repository.listFloors(house.id);
    if (floors.length === 1) {
      const floor = floors[0];
      push({
        type: 'floor',
        floorId: floor.id,
        name: floor.name,
        houseId: house.id,
        houseName: house.name,
      });
    } else {
      push({ type: 'house', houseId: house.id, name: house.name });
    }
  }

  async function handleCreate(name: string) {
    try {
      const house = await repository.createHouse({ name, ownerUid: await getOwnerUid() });
      const floor = await repository.createFloor({
        houseId: house.id,
        name: '1층',
        order: 0,
        planPhotoId: null,
      });
      setDialog({ type: 'none' });
      push({
        type: 'floor',
        floorId: floor.id,
        name: floor.name,
        houseId: house.id,
        houseName: house.name,
      });
    } catch {
      showToast('집을 만들지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRename(house: House, name: string) {
    try {
      await repository.updateHouse(house.id, { name });
      setDialog({ type: 'none' });
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDelete(house: House) {
    try {
      await repository.removeHouse(house.id);
      setDialog({ type: 'none' });
      showToast('집을 삭제했어요.');
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleJoin(code: string) {
    try {
      const house = await repository.joinHouse(code.toUpperCase(), await getOwnerUid());
      if (!house) {
        showToast('존재하지 않는 코드예요.');
        return;
      }
      setDialog({ type: 'none' });
      showToast(`'${house.name}' 집에 참여했어요.`);
      openHouse(house);
    } catch {
      showToast('참여하지 못했어요. 다시 시도해주세요.');
    }
  }

  if (houses === null) {
    return <Loading />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {houses.length === 0 ? (
        <EmptyState
          title="아직 등록된 집이 없어요"
          description="집을 추가하고 도면을 등록하면 물건 위치를 기록할 수 있어요."
          actions={[
            { label: '새 집 만들기', onClick: () => setDialog({ type: 'create' }), primary: true },
            { label: '가족 코드로 참여', onClick: () => setDialog({ type: 'join' }) },
            { label: '체험하기', onClick: () => enterDemo() },
          ]}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setDialog({ type: 'create' })}
            className="mb-3 flex h-14 w-full items-center justify-center rounded-full border-2 border-dashed border-soft-line text-lg font-medium text-ink-sub active:bg-soft"
          >
            ➕ 새 집 만들기
          </button>

          <ul className="flex flex-col gap-2">
            {houses.map((house) => (
              <li
                key={house.id}
                className="flex flex-col rounded-3xl border border-line bg-white"
              >
                <button
                  type="button"
                  onClick={() => openHouse(house)}
                  className="flex h-40 items-center px-4 text-left text-lg font-medium text-ink active:bg-bg"
                >
                  {house.name}
                </button>
                <div className="flex items-center gap-1 border-t border-line px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'rename', house })}
                    className="flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium text-ink active:bg-bg"
                  >
                    ✏️ 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => push({ type: 'share', houseId: house.id, houseName: house.name })}
                    className="flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium text-ink active:bg-bg"
                  >
                    👪 가족 공유
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'delete', house })}
                    className="flex h-12 flex-1 items-center justify-center rounded-full text-[15px] font-medium text-danger active:bg-danger/10"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => enterDemo()}
            disabled={demoStarting}
            className="mt-4 self-center text-[15px] font-medium text-navy underline active:opacity-70 disabled:opacity-50"
          >
            체험하기 모드로 둘러보기
          </button>
        </>
      )}

      <PromptDialog
        open={dialog.type === 'create'}
        title="새 집 만들기"
        placeholder="예: 우리 집"
        confirmLabel="만들기"
        onConfirm={handleCreate}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <PromptDialog
        open={dialog.type === 'join'}
        title="가족 코드로 참여"
        description="가족이 알려준 집 코드를 입력해주세요."
        placeholder="예: AB3D7FQK"
        confirmLabel="참여"
        onConfirm={handleJoin}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <PromptDialog
        open={dialog.type === 'rename'}
        title="집 이름 수정"
        initialValue={dialog.type === 'rename' ? dialog.house.name : ''}
        confirmLabel="저장"
        onConfirm={(name) => dialog.type === 'rename' && handleRename(dialog.house, name)}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <ConfirmDialog
        open={dialog.type === 'delete'}
        title="이 집을 삭제할까요?"
        description="이 집의 모든 층·방·가구·보관함·물건이 함께 삭제돼요."
        confirmLabel="삭제"
        danger
        onConfirm={() => dialog.type === 'delete' && handleDelete(dialog.house)}
        onCancel={() => setDialog({ type: 'none' })}
      />
    </div>
  );
}
