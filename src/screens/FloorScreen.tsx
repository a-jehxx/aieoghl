import { useEffect, useRef, useState } from 'react';
import { repository } from '@/repository';
import type { Floor, Point, Room } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { useToastStore } from '@/store/toastStore';
import { useGuideStore } from '@/store/guideStore';
import { Loading } from '@/components/common/Loading';
import { PromptDialog } from '@/components/common/PromptDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ActionSheet } from '@/components/common/ActionSheet';
import { SelectedItemBar } from '@/components/common/SelectedItemBar';
import { PhotoCanvas } from '@/components/photo/PhotoCanvas';
import { compressImage, PLAN_IMAGE_OPTIONS } from '@/lib/compressImage';

interface FloorScreenProps {
  floorId: string;
}

type Mode = 'view' | 'edit';

type DialogState =
  | { type: 'none' }
  | { type: 'nameNewRoom' }
  | { type: 'renameRoom'; room: Room }
  | { type: 'deleteRoom'; room: Room };

export function FloorScreen({ floorId }: FloorScreenProps) {
  const [floor, setFloor] = useState<Floor | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<Mode>('view');
  const [drawingPoints, setDrawingPoints] = useState<Point[] | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const [replaceMenuOpen, setReplaceMenuOpen] = useState(false);

  const push = useNavigationStore((s) => s.push);
  const showToast = useToastStore((s) => s.show);
  const guideTarget = useGuideStore((s) => s.target);

  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  async function loadFloorAndPhoto() {
    setLoading(true);
    const f = await repository.getFloor(floorId);
    setFloor(f ?? null);
    if (f?.planPhotoId) {
      const photo = await repository.getPhoto(f.planPhotoId);
      setPhotoUrl(photo?.dataUrl ?? null);
    } else {
      setPhotoUrl(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    setMode('view');
    setDrawingPoints(null);
    setSelectedRoomId(null);
    loadFloorAndPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  useEffect(() => {
    const unsubscribe = repository.subscribeRooms(floorId, setRooms);
    return unsubscribe;
  }, [floorId]);

  function setModeTo(target: Mode) {
    if (target === mode) return;
    setMode(target);
    setDrawingPoints(null);
    setSelectedRoomId(null);
  }

  async function handlePlanFile(file: File | undefined) {
    if (!file || !floor) return;
    try {
      setUploading(true);
      const dataUrl = await compressImage(file, PLAN_IMAGE_OPTIONS);
      const photo = await repository.savePhoto(floorId, dataUrl);
      const oldPhotoId = floor.planPhotoId;
      await repository.updateFloor(floor.id, { planPhotoId: photo.id });
      if (oldPhotoId) await repository.removePhoto(oldPhotoId);
      await loadFloorAndPhoto();
    } catch {
      showToast('사진을 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  }

  function startDrawing() {
    setSelectedRoomId(null);
    setDrawingPoints([]);
  }

  function cancelDrawing() {
    setDrawingPoints(null);
  }

  function undoLastPoint() {
    setDrawingPoints((pts) => (pts && pts.length > 0 ? pts.slice(0, -1) : pts));
  }

  function finishDrawing() {
    if (!drawingPoints || drawingPoints.length < 3) return;
    setDialog({ type: 'nameNewRoom' });
  }

  async function handleCreateRoom(name: string) {
    if (!drawingPoints) return;
    try {
      await repository.createRoom({ floorId, name, points: drawingPoints });
      setDrawingPoints(null);
      setDialog({ type: 'none' });
    } catch {
      showToast('방을 추가하지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleRenameRoom(room: Room, name: string) {
    try {
      await repository.updateRoom(room.id, { name });
      setDialog({ type: 'none' });
      setSelectedRoomId(null);
    } catch {
      showToast('이름을 바꾸지 못했어요. 다시 시도해주세요.');
    }
  }

  async function handleDeleteRoom(room: Room) {
    try {
      await repository.removeRoom(room.id);
      setDialog({ type: 'none' });
      setSelectedRoomId(null);
      showToast('방을 삭제했어요.');
    } catch {
      showToast('삭제하지 못했어요. 다시 시도해주세요.');
    }
  }

  function handleTapHit(hitId: string) {
    if (drawingPoints !== null) return;
    const room = rooms.find((r) => r.id === hitId);
    if (!room) return;
    if (mode === 'view') {
      push({ type: 'room', roomId: room.id, name: room.name });
    } else {
      setSelectedRoomId(room.id);
    }
  }

  function handleEmptyTap(point: Point) {
    if (mode === 'edit' && drawingPoints !== null) {
      setDrawingPoints((pts) => [...(pts ?? []), point]);
      return;
    }
    if (mode === 'edit' && selectedRoomId) {
      setSelectedRoomId(null);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!floor) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
        층 정보를 찾을 수 없어요.
      </div>
    );
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  return (
    <div className="flex h-full flex-col">
      {!photoUrl && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-base font-semibold text-slate-900">이 층의 도면 사진을 추가해주세요</p>
          <p className="text-sm text-slate-500">도면 위에 방을 그려서 물건 위치를 기록할 수 있어요.</p>
          <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
            <button
              type="button"
              onClick={() => fileInputCameraRef.current?.click()}
              className="h-12 rounded-xl bg-blue-600 text-base font-medium text-white active:bg-blue-700"
            >
              도면 사진 촬영
            </button>
            <button
              type="button"
              onClick={() => fileInputGalleryRef.current?.click()}
              className="h-12 rounded-xl bg-slate-100 text-base font-medium text-slate-700 active:bg-slate-200"
            >
              도면 가져오기
            </button>
          </div>
        </div>
      )}

      {photoUrl && (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
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
            <button
              type="button"
              onClick={() => setReplaceMenuOpen(true)}
              className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
            >
              도면 교체
            </button>
          </div>

          {/* min-h-0: 세로로 긴 도면 사진이 있으면 flex 자식이 화면보다 커져서 아래쪽 버튼들이 가려질 수 있다. */}
          <div className="relative min-h-0 flex-1">
            <PhotoCanvas
              imageUrl={photoUrl}
              resetKey={floorId}
              onTapHit={handleTapHit}
              onEmptyTap={handleEmptyTap}
              overlay={
                <>
                  {rooms.map((room) => {
                    const blinking = guideTarget?.floorId === floorId && guideTarget?.roomId === room.id;
                    return (
                      <polygon
                        key={room.id}
                        data-hit-id={room.id}
                        points={room.points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                        className={
                          blinking
                            ? 'hsm-blink-shape'
                            : selectedRoomId === room.id
                              ? 'fill-blue-500/40 stroke-blue-700'
                              : 'fill-blue-500/25 stroke-blue-600'
                        }
                        strokeWidth={0.6}
                      />
                    );
                  })}
                  {drawingPoints && drawingPoints.length > 0 && (
                    <>
                      <polyline
                        points={drawingPoints.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                        className="fill-none stroke-amber-500"
                        strokeWidth={0.6}
                        strokeDasharray="2,1.5"
                      />
                      {drawingPoints.map((p, i) => (
                        <circle key={i} cx={p.x * 100} cy={p.y * 100} r={1.2} className="fill-amber-500" />
                      ))}
                    </>
                  )}
                </>
              }
            />

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loading label="사진을 처리하는 중..." />
              </div>
            )}

            {mode === 'edit' && drawingPoints === null && !selectedRoomId && (
              <button
                type="button"
                onClick={startDrawing}
                aria-label="방 추가"
                className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg active:bg-blue-700"
              >
                +
              </button>
            )}

            {mode === 'edit' && drawingPoints !== null && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/95 p-3">
                <button
                  type="button"
                  onClick={cancelDrawing}
                  className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-700 active:bg-slate-200"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={undoLastPoint}
                  disabled={drawingPoints.length === 0}
                  className="h-11 flex-1 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 active:bg-slate-200 disabled:opacity-40"
                >
                  되돌리기
                </button>
                <button
                  type="button"
                  onClick={finishDrawing}
                  disabled={drawingPoints.length < 3}
                  className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-40"
                >
                  완료
                </button>
              </div>
            )}

            {mode === 'edit' && selectedRoom && (
              <SelectedItemBar
                label={selectedRoom.name}
                onRename={() => setDialog({ type: 'renameRoom', room: selectedRoom })}
                onDelete={() => setDialog({ type: 'deleteRoom', room: selectedRoom })}
                onClose={() => setSelectedRoomId(null)}
              />
            )}
          </div>
        </>
      )}

      <input
        ref={fileInputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handlePlanFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputGalleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handlePlanFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <ActionSheet
        open={replaceMenuOpen}
        title="도면 교체"
        options={[
          {
            label: '촬영',
            onSelect: () => {
              setReplaceMenuOpen(false);
              fileInputCameraRef.current?.click();
            },
          },
          {
            label: '갤러리에서 가져오기',
            onSelect: () => {
              setReplaceMenuOpen(false);
              fileInputGalleryRef.current?.click();
            },
          },
        ]}
        onCancel={() => setReplaceMenuOpen(false)}
      />

      <PromptDialog
        open={dialog.type === 'nameNewRoom'}
        title="방 이름"
        placeholder="예: 안방"
        confirmLabel="추가"
        onConfirm={handleCreateRoom}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <PromptDialog
        open={dialog.type === 'renameRoom'}
        title="방 이름 수정"
        initialValue={dialog.type === 'renameRoom' ? dialog.room.name : ''}
        confirmLabel="저장"
        onConfirm={(name) => dialog.type === 'renameRoom' && handleRenameRoom(dialog.room, name)}
        onCancel={() => setDialog({ type: 'none' })}
      />
      <ConfirmDialog
        open={dialog.type === 'deleteRoom'}
        title="이 방을 삭제할까요?"
        description="이 방의 모든 가구·보관함·물건이 함께 삭제돼요."
        confirmLabel="삭제"
        danger
        onConfirm={() => dialog.type === 'deleteRoom' && handleDeleteRoom(dialog.room)}
        onCancel={() => setDialog({ type: 'none' })}
      />
    </div>
  );
}
