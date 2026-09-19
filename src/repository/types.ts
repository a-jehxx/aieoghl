import type { Bin, Floor, Furniture, House, Item, Photo, Point, Room } from '@/types';

/**
 * 화면 코드가 실제 저장소(메모리/Firebase)를 모르게 하기 위한 공용 인터페이스.
 * 부모 항목을 삭제하면 구현체가 하위 항목과 연결된 사진까지 함께 삭제한다.
 */
export interface Repository {
  // 집
  listHouses(): Promise<House[]>;
  /** 이 기기가 속한 집 목록을 구독한다. 등록 즉시 현재 값을, 이후 바뀔 때마다 다시 호출한다. */
  subscribeHouses(callback: (houses: House[]) => void): () => void;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(input: { name: string; ownerUid: string }): Promise<House>;
  updateHouse(id: string, patch: Partial<{ name: string }>): Promise<House>;
  removeHouse(id: string): Promise<void>;

  // 가족 공유
  /** 가족 공유 코드로 집에 참여한다. 이 기기를 멤버로 등록해 집 목록에 보이게 한다. 존재하지 않으면 undefined. */
  joinHouse(code: string, uid: string): Promise<House | undefined>;
  /** 이 집의 공유 코드를 새로 만들거나(없으면) 재발급한다(있으면 기존 코드를 지우고 새로 만든다). */
  createOrRegenerateShareCode(houseId: string): Promise<string>;
  /** 구성원이 이 집에서 나간다. 본인 멤버십만 지운다 — 집 데이터는 그대로 남는다. */
  leaveHouse(houseId: string, uid: string): Promise<void>;
  /** 소유자가 공유를 중지한다. 공유 코드를 지우고 소유자 외 모든 구성원을 제거한다. */
  stopSharing(houseId: string): Promise<void>;

  // 층
  listFloors(houseId: string): Promise<Floor[]>;
  subscribeFloors(houseId: string, callback: (floors: Floor[]) => void): () => void;
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
  subscribeRooms(floorId: string, callback: (rooms: Room[]) => void): () => void;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(input: { floorId: string; name: string; points: Point[] }): Promise<Room>;
  updateRoom(id: string, patch: Partial<{ name: string; points: Point[] }>): Promise<Room>;
  removeRoom(id: string): Promise<void>;

  // 가구
  listFurniture(roomId: string): Promise<Furniture[]>;
  subscribeFurniture(roomId: string, callback: (furniture: Furniture[]) => void): () => void;
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
  subscribeBins(furnitureId: string, callback: (bins: Bin[]) => void): () => void;
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
  subscribeItems(binId: string, callback: (items: Item[]) => void): () => void;
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
  /**
   * parentId는 이 사진이 속할 층/방/가구/보관함 등 호출부가 이미 들고 있는 id다.
   * Firebase 구현이 어느 집(houseId) 아래에 사진을 저장할지 찾는 데만 쓰고, 그 외엔 의미가 없다.
   */
  savePhoto(parentId: string, dataUrl: string): Promise<Photo>;
  removePhoto(id: string): Promise<void>;
}
