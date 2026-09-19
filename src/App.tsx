import { useEffect, useState } from 'react';
import { useNavigationStore, type Screen } from '@/store/navigationStore';
import { useGuideStore } from '@/store/guideStore';
import { useDemoStore } from '@/store/demoStore';
import { useConnectionStore } from '@/firebase/connection';
import { formatLocationPath } from '@/lib/search';
import { TopBar } from '@/components/common/TopBar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { GuideBanner } from '@/components/common/GuideBanner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { DemoBanner } from '@/components/common/DemoBanner';
import { InstallBanner } from '@/components/common/InstallBanner';
import { Toast } from '@/components/common/Toast';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { MainScreen } from '@/screens/MainScreen';
import { HouseScreen } from '@/screens/HouseScreen';
import { FloorScreen } from '@/screens/FloorScreen';
import { RoomScreen } from '@/screens/RoomScreen';
import { FurnitureScreen } from '@/screens/FurnitureScreen';
import { BinScreen } from '@/screens/BinScreen';

function getScreenTitle(screen: Screen): string {
  switch (screen.type) {
    case 'main':
      return 'HSM';
    case 'house':
      return screen.name;
    case 'floor':
      return screen.name;
    case 'room':
      return screen.name;
    case 'furniture':
      return screen.name;
    case 'bin':
      return screen.name;
  }
}

function renderScreen(screen: Screen) {
  switch (screen.type) {
    case 'main':
      return <MainScreen />;
    case 'house':
      return <HouseScreen houseId={screen.houseId} houseName={screen.name} />;
    case 'floor':
      return <FloorScreen floorId={screen.floorId} />;
    case 'room':
      return <RoomScreen roomId={screen.roomId} />;
    case 'furniture':
      return <FurnitureScreen furnitureId={screen.furnitureId} />;
    case 'bin':
      return <BinScreen binId={screen.binId} />;
  }
}

function isOnGuidePath(screen: Screen, target: { floorId: string; roomId: string; furnitureId: string; binId: string }) {
  switch (screen.type) {
    case 'floor':
      return screen.floorId === target.floorId;
    case 'room':
      return screen.roomId === target.roomId;
    case 'furniture':
      return screen.furnitureId === target.furnitureId;
    case 'bin':
      return screen.binId === target.binId;
    default:
      return false;
  }
}

export default function App() {
  const stack = useNavigationStore((s) => s.stack);
  const exitConfirmOpen = useNavigationStore((s) => s.exitConfirmOpen);
  const goBack = useNavigationStore((s) => s.goBack);
  const goHome = useNavigationStore((s) => s.goHome);
  const push = useNavigationStore((s) => s.push);
  const confirmExit = useNavigationStore((s) => s.confirmExit);
  const cancelExit = useNavigationStore((s) => s.cancelExit);
  const handlePopState = useNavigationStore((s) => s.handlePopState);
  const guideTarget = useGuideStore((s) => s.target);
  const stopGuide = useGuideStore((s) => s.stop);
  const demoActive = useDemoStore((s) => s.active);
  const exitDemo = useDemoStore((s) => s.exit);
  const connected = useConnectionStore((s) => s.connected);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // 폰의 뒤로가기(popstate)를 항상 가로챌 수 있도록 히스토리 항목을 하나 더 쌓아둔다.
    window.history.pushState({ depth: 1 }, '');
    const onPopState = () => handlePopState();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handlePopState]);

  const current = stack[stack.length - 1];

  const houseContext =
    current.type === 'house'
      ? { houseId: current.houseId, houseName: current.name }
      : current.type === 'floor'
        ? { houseId: current.houseId, houseName: current.houseName }
        : null;

  const extra = (
    <>
      {houseContext && (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="검색"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-slate-100"
        >
          🔍
        </button>
      )}
      {current.type === 'floor' && (
        <button
          type="button"
          onClick={() => push({ type: 'house', houseId: current.houseId, name: current.houseName })}
          aria-label="층 관리"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl active:bg-slate-100"
        >
          🗂
        </button>
      )}
    </>
  );

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <TopBar title={getScreenTitle(current)} onBack={goBack} onHome={goHome} extra={extra} />
      {!connected && !demoActive && <OfflineBanner />}
      {demoActive && <DemoBanner onExit={exitDemo} />}
      {guideTarget && (
        <GuideBanner
          itemName={guideTarget.itemName}
          path={`${formatLocationPath(guideTarget)} › ${guideTarget.itemName}`}
          offPath={!isOnGuidePath(current, guideTarget)}
          onStop={stopGuide}
        />
      )}
      <main className="relative flex-1 overflow-hidden">
        {renderScreen(current)}
        <InstallBanner />
      </main>
      <ConfirmDialog
        open={exitConfirmOpen}
        title="앱을 종료하시겠습니까?"
        confirmLabel="예"
        cancelLabel="아니오"
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
      <SearchOverlay
        open={searchOpen}
        houseId={houseContext?.houseId ?? null}
        houseName={houseContext?.houseName ?? ''}
        onClose={() => setSearchOpen(false)}
      />
      <Toast />
    </div>
  );
}
