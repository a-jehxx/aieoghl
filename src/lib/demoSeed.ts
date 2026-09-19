import { createMemoryRepository } from '@/repository/memoryRepository';
import type { Repository } from '@/repository/types';
import { DEMO_ROOMS } from './demo/demoData';
import { demoFloorPlanDataUrl } from './demo/floorPlanSvg';
import { DEMO_FURNITURE, furnitureDataUrl } from './demo/furnitureAssets';
import { DEMO_ZONES, zoneByKey, zoneToUnitPolygon } from './demo/floorLayout';

export interface DemoEntry {
  repository: Repository;
  houseId: string;
  houseName: string;
  floorId: string;
  floorName: string;
}

function furnitureByKey(key: string) {
  const piece = DEMO_FURNITURE.find((f) => f.key === key);
  if (!piece) throw new Error(`알 수 없는 가구 key: ${key}`);
  return piece;
}

/** 로그인·서버 없이 쓸 수 있는 독립된 메모리 저장소에 체험용 샘플 집(84㎡ 3룸 아파트)을 채워 넣는다. */
export async function createDemoRepository(): Promise<DemoEntry> {
  const repo = createMemoryRepository();

  const house = await repo.createHouse({ name: '체험용 우리집', ownerUid: 'demo' });
  const planPhoto = await repo.savePhoto(house.id, demoFloorPlanDataUrl());
  const floor = await repo.createFloor({ houseId: house.id, name: '1층', order: 0, planPhotoId: planPhoto.id });

  const registeredZones = DEMO_ZONES.filter((z) => z.registered);

  for (const roomSpec of DEMO_ROOMS) {
    const zone = zoneByKey(roomSpec.zoneKey);
    if (!zone.registered) throw new Error(`등록 대상이 아닌 방: ${zone.key}`);

    const room = await repo.createRoom({
      floorId: floor.id,
      name: zone.label,
      points: zoneToUnitPolygon(zone),
    });

    for (const furnitureSpec of roomSpec.furniture) {
      const piece = furnitureByKey(furnitureSpec.furnitureKey);
      const photo = await repo.savePhoto(room.id, furnitureDataUrl(piece));
      const furniture = await repo.createFurniture({
        roomId: room.id,
        name: piece.name,
        photoId: photo.id,
        x: furnitureSpec.x,
        y: furnitureSpec.y,
      });

      for (const binSpec of furnitureSpec.bins) {
        const binDef = piece.bins.find((b) => b.name === binSpec.binName);
        if (!binDef) throw new Error(`${piece.name}에 없는 보관함: ${binSpec.binName}`);
        const [x, y, w, h] = binDef.rect;
        const bin = await repo.createBin({ furnitureId: furniture.id, name: binDef.name, x, y, w, h });

        for (const itemSpec of binSpec.items) {
          await repo.createItem({ binId: bin.id, name: itemSpec.name, emoji: itemSpec.emoji });
        }
      }
    }
  }

  // 등록되지 않은(도면에만 있는) 구역 개수도 맞는지 확인 — 등록된 9개 외 6개.
  const unregisteredCount = DEMO_ZONES.length - registeredZones.length;
  if (unregisteredCount !== 6) {
    throw new Error(`도면에만 있는 구역 수가 예상과 다름: ${unregisteredCount}`);
  }

  return { repository: repo, houseId: house.id, houseName: house.name, floorId: floor.id, floorName: floor.name };
}
