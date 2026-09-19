import { repository } from '@/repository';
import type { Item } from '@/types';

export interface SearchResult {
  item: Item;
  photoUrl: string | null;
  floorId: string;
  floorName: string;
  roomId: string;
  roomName: string;
  furnitureId: string;
  furnitureName: string;
  binId: string;
  binName: string;
}

function normalize(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase();
}

/** 집 안의 모든 물건 중 이름이 부분 일치(공백·대소문자 무시)하는 것을 찾는다. */
export async function searchItemsInHouse(houseId: string, query: string): Promise<SearchResult[]> {
  const q = normalize(query);
  if (!q) return [];

  const results: SearchResult[] = [];
  const floors = await repository.listFloors(houseId);

  for (const floor of floors) {
    const rooms = await repository.listRooms(floor.id);
    for (const room of rooms) {
      const furnitureList = await repository.listFurniture(room.id);
      for (const furniture of furnitureList) {
        const bins = await repository.listBins(furniture.id);
        for (const bin of bins) {
          const items = await repository.listItems(bin.id);
          for (const item of items) {
            if (!normalize(item.name).includes(q)) continue;
            let photoUrl: string | null = null;
            if (item.photoId) {
              const photo = await repository.getPhoto(item.photoId);
              photoUrl = photo?.dataUrl ?? null;
            }
            results.push({
              item,
              photoUrl,
              floorId: floor.id,
              floorName: floor.name,
              roomId: room.id,
              roomName: room.name,
              furnitureId: furniture.id,
              furnitureName: furniture.name,
              binId: bin.id,
              binName: bin.name,
            });
          }
        }
      }
    }
  }

  return results;
}

export function formatLocationPath(r: {
  floorName: string;
  roomName: string;
  furnitureName: string;
  binName: string;
}): string {
  return `${r.floorName} › ${r.roomName} › ${r.furnitureName} › ${r.binName}`;
}
