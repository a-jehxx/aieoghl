import type { Bin, Floor, Furniture, House, Item, Photo, Point, Room } from '@/types';

/**
 * 화면 코드가 실제 저장소(메모리/Firebase)를 모르게 하기 위한 공용 인터페이스.
 * 부모 항목을 삭제하면 구현체가 하위 항목과 연결된 사진까지 함께 삭제한다.
 */
export interface Repository {
  // 집
  listHouses(): Promise<House[]>;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(input: { name: string; ownerUid: string }): Promise<House>;
  updateHouse(id: string, patch: Partial<{ name: string }>): Promise<House>;
  removeHouse(id: string): Promise<void>;

  // 층
  listFloors(houseId: string): Promise<Floor[]>;
  getFloor(id: string): Promise<Floor | undefined>;
  createFloor(input: {
    houseId: string;
    name: string;
    order: number;
    planPhotoId: string | null;
  }): Promise<Floor>;
  updateFloor(
    id: string,
    patch: Partial<{ name: string; order: number; planPhotoId: string | null }>,
  ): Promise<Floor>;
  removeFloor(id: string): Promise<void>;

  // 방
  listRooms(floorId: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(input: { floorId: string; name: string; points: Point[] }): Promise<Room>;
  updateRoom(id: string, patch: Partial<{ name: string; points: Point[] }>): Promise<Room>;
  removeRoom(id: string): Promise<void>;

  // 가구
  listFurniture(roomId: string): Promise<Furniture[]>;
  getFurniture(id: string): Promise<Furniture | undefined>;
  createFurniture(input: {
    roomId: string;
    name: string;
    photoId: string | null;
    x: number;
    y: number;
  }): Promise<Furniture>;
  updateFurniture(
    id: string,
    patch: Partial<{ name: string; photoId: string | null; x: number; y: number }>,
  ): Promise<Furniture>;
  removeFurniture(id: string): Promise<void>;

  // 보관함
  listBins(furnitureId: string): Promise<Bin[]>;
  getBin(id: string): Promise<Bin | undefined>;
  createBin(input: {
    furnitureId: string;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }): Promise<Bin>;
  updateBin(
    id: string,
    patch: Partial<{ name: string; x: number; y: number; w: number; h: number }>,
  ): Promise<Bin>;
  removeBin(id: string): Promise<void>;

  // 물건
  listItems(binId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(input: {
    binId: string;
    name: string;
    emoji?: string;
    photoId?: string | null;
  }): Promise<Item>;
  updateItem(
    id: string,
    patch: Partial<{ name: string; emoji?: string; photoId?: string | null }>,
  ): Promise<Item>;
  removeItem(id: string): Promise<void>;

  // 사진 (다른 항목과 분리된 컬렉션)
  getPhoto(id: string): Promise<Photo | undefined>;
  savePhoto(dataUrl: string): Promise<Photo>;
  removePhoto(id: string): Promise<void>;
}
