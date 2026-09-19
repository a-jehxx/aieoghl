import { useEffect, useState } from 'react';
import { repository } from '@/repository';
import type { House } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { useToastStore } from '@/store/toastStore';
import { getOwnerUid } from '@/lib/ownerUid';
import { Loading } from '@/components/common/Loading';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface ShareScreenProps {
  houseId: string;
}

type DialogState = { type: 'none' } | { type: 'confirmStop' };

export function ShareScreen({ houseId }: ShareScreenProps) {
  const [house, setHouse] = useState<House | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });

  const showToast = useToastStore((s) => s.show);
  const goHome = useNavigationStore((s) => s.goHome);

  async function load() {
    const [h, myUid] = await Promise.all([repository.getHouse(houseId), getOwnerUid()]);
    setHouse(h ?? null);
    setUid(myUid);
  }

  useEffect(() => {
    setHouse(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houseId]);

  const isOwner = !!house && !!uid && house.ownerUid === uid;

  async function handleCreateOrRegenerate() {
    setBusy(true);
    try {
      await repository.createOrRegenerateShareCode(houseId);
      await load();
      showToast('코드를 만들었어요.');
    } catch {
      showToast('코드를 만들지 못했어요. 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!house?.shareCode) return;
    try {
      await navigator.clipboard.writeText(house.shareCode);
      showToast('코드를 복사했어요.');
    } catch {
      showToast('복사하지 못했어요.');
    }
  }

  async function handleShare() {
    if (!house?.shareCode) return;
    try {
      await navigator.share({ title: 'HSM 가족 공유 코드', text: `우리집 코드: ${house.shareCode}` });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        showToast('공유하지 못했어요.');
      }
    }
  }

  async function handleStop() {
    if (!uid || !house) return;
    setBusy(true);
    try {
      if (isOwner) {
        await repository.stopSharing(houseId);
        setDialog({ type: 'none' });
        await load();
        showToast('공유를 중지했어요.');
      } else {
        await repository.leaveHouse(houseId, uid);
        setDialog({ type: 'none' });
        showToast('집에서 나갔어요.');
        goHome();
      }
    } catch {
      showToast('처리하지 못했어요. 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  }

  if (!house || !uid) {
    return <Loading />;
  }

  const canShare = typeof navigator.share === 'function';

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {house.shareCode ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-slate-500">가족 코드</p>
          <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-slate-900">{house.shareCode}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="h-11 flex-1 rounded-xl bg-blue-600 text-base font-medium text-white active:bg-blue-700"
            >
              복사하기
            </button>
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                className="h-11 flex-1 rounded-xl bg-slate-100 text-base font-medium text-slate-700 active:bg-slate-200"
              >
                공유하기
              </button>
            )}
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={handleCreateOrRegenerate}
              disabled={busy}
              className="mt-3 h-11 w-full rounded-xl bg-slate-100 text-base font-medium text-slate-700 active:bg-slate-200 disabled:opacity-50"
            >
              코드 재발급
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
          <p className="text-sm text-slate-500">아직 가족과 공유하고 있지 않아요.</p>
          {isOwner && (
            <button
              type="button"
              onClick={handleCreateOrRegenerate}
              disabled={busy}
              className="mt-3 h-12 w-full rounded-xl bg-blue-600 text-base font-medium text-white active:bg-blue-700 disabled:opacity-50"
            >
              공유 시작하기
            </button>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        앱 데이터를 지우거나 폰을 바꾸면 코드로 다시 참여해야 해요.
      </p>

      <button
        type="button"
        onClick={() => setDialog({ type: 'confirmStop' })}
        className="mt-6 h-12 rounded-xl bg-red-50 text-base font-medium text-red-600 active:bg-red-100"
      >
        {isOwner ? '공유 중지' : '집에서 나가기'}
      </button>

      <ConfirmDialog
        open={dialog.type === 'confirmStop'}
        title={isOwner ? '공유를 중지할까요?' : '이 집에서 나갈까요?'}
        description={
          isOwner
            ? '다른 구성원이 모두 제거돼요. 이후 다시 공유하려면 코드를 새로 만들어야 해요.'
            : '집 데이터는 그대로 남아요.'
        }
        confirmLabel={isOwner ? '중지' : '나가기'}
        danger
        onConfirm={handleStop}
        onCancel={() => setDialog({ type: 'none' })}
      />
    </div>
  );
}
