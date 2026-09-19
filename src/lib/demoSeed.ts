import { createMemoryRepository } from '@/repository/memoryRepository';
import type { Repository } from '@/repository/types';
import {
  DEMO_CABINET_PHOTO,
  DEMO_DESK_PHOTO,
  DEMO_FLOOR_PLAN,
  DEMO_SOFA_PHOTO,
  DEMO_TV_STAND_PHOTO,
  DEMO_WARDROBE_PHOTO,
} from './demoAssets';

export interface DemoEntry {
  repository: Repository;
  houseId: string;
  houseName: string;
  floorId: string;
  floorName: string;
}

/** 로그인·서버 없이 쓸 수 있는 독립된 메모리 저장소에 체험용 샘플 집을 채워 넣는다. */
export async function createDemoRepository(): Promise<DemoEntry> {
  const repo = createMemoryRepository();

  const house = await repo.createHouse({ name: '체험용 우리집', ownerUid: 'demo' });
  const planPhoto = await repo.savePhoto(house.id, DEMO_FLOOR_PLAN);
  const floor = await repo.createFloor({ houseId: house.id, name: '1층', order: 0, planPhotoId: planPhoto.id });

  const livingRoom = await repo.createRoom({
    floorId: floor.id,
    name: '거실',
    points: [
      { x: 0.04, y: 0.48 },
      { x: 0.68, y: 0.48 },
      { x: 0.68, y: 0.95 },
      { x: 0.04, y: 0.95 },
    ],
  });
  const kitchen = await repo.createRoom({
    floorId: floor.id,
    name: '주방',
    points: [
      { x: 0.04, y: 0.05 },
      { x: 0.68, y: 0.05 },
      { x: 0.68, y: 0.48 },
      { x: 0.04, y: 0.48 },
    ],
  });
  const bedroom = await repo.createRoom({
    floorId: floor.id,
    name: '침실',
    points: [
      { x: 0.68, y: 0.05 },
      { x: 0.96, y: 0.05 },
      { x: 0.96, y: 0.95 },
      { x: 0.68, y: 0.95 },
    ],
  });

  async function addFurniture(roomId: string, name: string, photoDataUrl: string, x: number, y: number) {
    const photo = await repo.savePhoto(roomId, photoDataUrl);
    return repo.createFurniture({ roomId, name, photoId: photo.id, x, y });
  }
  async function addBin(furnitureId: string, name: string, x: number, y: number, w: number, h: number) {
    return repo.createBin({ furnitureId, name, x, y, w, h });
  }
  async function addItem(binId: string, name: string, emoji: string) {
    return repo.createItem({ binId, name, emoji });
  }

  const tvStand = await addFurniture(livingRoom.id, 'TV장', DEMO_TV_STAND_PHOTO, 0.3, 0.15);
  const sofa = await addFurniture(livingRoom.id, '소파', DEMO_SOFA_PHOTO, 0.65, 0.15);
  const cabinet = await addFurniture(kitchen.id, '수납장', DEMO_CABINET_PHOTO, 0.5, 0.15);
  const wardrobe = await addFurniture(bedroom.id, '옷장', DEMO_WARDROBE_PHOTO, 0.3, 0.15);
  const desk = await addFurniture(bedroom.id, '책상', DEMO_DESK_PHOTO, 0.65, 0.15);

  const tvDrawer = await addBin(tvStand.id, '서랍', 0.35, 0.4, 0.3, 0.22);
  const sofaGap = await addBin(sofa.id, '쿠션 밑', 0.35, 0.4, 0.3, 0.22);
  const cabinetTop = await addBin(cabinet.id, '위 칸', 0.3, 0.15, 0.4, 0.25);
  const cabinetBottom = await addBin(cabinet.id, '아래 칸', 0.3, 0.55, 0.4, 0.25);
  const wardrobeDrawer = await addBin(wardrobe.id, '서랍', 0.35, 0.4, 0.3, 0.22);
  const deskDrawer = await addBin(desk.id, '서랍', 0.35, 0.4, 0.3, 0.22);

  await addItem(tvDrawer.id, '리모컨', '📺');
  await addItem(tvDrawer.id, '건전지', '🔋');
  await addItem(tvDrawer.id, '충전기', '🔌');

  await addItem(sofaGap.id, '동전', '🪙');
  await addItem(sofaGap.id, '안경', '👓');

  await addItem(cabinetTop.id, '숟가락', '🥄');
  await addItem(cabinetTop.id, '종이컵', '🥤');
  await addItem(cabinetBottom.id, '양초', '🕯️');

  await addItem(wardrobeDrawer.id, '양말', '🧦');
  await addItem(wardrobeDrawer.id, '장갑', '🧤');

  await addItem(deskDrawer.id, '볼펜심', '🖊️');
  await addItem(deskDrawer.id, '가위', '✂️');
  await addItem(deskDrawer.id, '클립', '📎');

  return { repository: repo, houseId: house.id, houseName: house.name, floorId: floor.id, floorName: floor.name };
}
