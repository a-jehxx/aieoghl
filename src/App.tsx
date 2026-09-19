import { useEffect, useState } from 'react';
import { Search, Folder, Users } from 'lucide-react';
import { useNavigationStore, type Screen } from '@/store/navigationStore';
import { useGuideStore } from '@/store/guideStore';
import { useDemoStore } from '@/store/demoStore';
import { useConnectionStore } from '@/firebase/connection';
import { formatLocationPath } from '@/lib/search';
import { TopBar } from '@/components/common/TopBar';
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
import { ShareScreen } from '@/screens/ShareScreen';

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
    case 'share':
      return '가족 공유';
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
    case 'share':
      return <ShareScreen houseId={screen.houseId} />;
  }
}

/**
 * room/furniture/bin 화면은 자기가 어느 집 소속인지 직접 모른다(스택에 houseId가 없음).
 * 대신 화면 이동 스택을 거슬러 올라가 가장 가까운 house/floor/share 화면에서 집 정보를 찾는다.
 */
function findHouseContext(stack: Screen[]): { houseId: string; houseName: string } | null {
  for (let i = stack.length - 1; i >= 0; i--) {
    const screen = stack[i];
    if (screen.type === 'house') return { houseId: screen.houseId, houseName: screen.name };
    if (screen.type === 'floor') return { houseId: screen.houseId, houseName: screen.houseName };
    if (screen.type === 'share') return { houseId: screen.houseId, houseName: screen.houseName };
  }
  return null;
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
  const goBack = useNavigationStore((s) => s.goBack);
  const goHome = useNavigationStore((s) => s.goHome);
  const push = useNavigationStore((s) => s.push);
  const handlePopState = useNavigationStore((s) => s.handlePopState);
  const guideTarget = useGuideStore((s) => s.target);
  const stopGuide = useGuideStore((s) => s.stop);
  const demoActive = useDemoStore((s) => s.active);
  const exitDemo = useDemoStore((s) => s.exit);
  const connected = useConnectionStore((s) => s.connected);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => handlePopState();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handlePopState]);

  const current = stack[stack.length - 1];
  const houseContext = findHouseContext(stack);

  const extra = (
    <>
      {houseContext && (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="검색"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
        >
          <Search size={22} strokeWidth={2} />
        </button>
      )}
      {current.type === 'floor' && (
        <button
          type="button"
          onClick={() => push({ type: 'house', houseId: current.houseId, name: current.houseName })}
          aria-label="층 관리"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
        >
          <Folder size={22} strokeWidth={2} />
        </button>
      )}
      {current.type === 'house' && (
        <button
          type="button"
          onClick={() => push({ type: 'share', houseId: current.houseId, houseName: current.name })}
          aria-label="가족 공유"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
        >
          <Users size={22} strokeWidth={2} />
        </button>
      )}
    </>
  );

  return (
    <div className="flex h-dvh flex-col bg-bg">
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
      <main className="relative flex-1 overflow-hidden">{renderScreen(current)}</main>
      <InstallBanner />
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
