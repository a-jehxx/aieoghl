import type { Bin, Floor, Furniture, House, Item, Photo, Room } from '@/types';
import type { Repository } from './types';
import { generateId } from '@/lib/id';

function now() {
  return Date.now();
}

function makeId() {
  return generateId();
}

/** 컬렉션 하나에 대한 "부모 id별 구독자" 등록/알림을 담당하는 작은 헬퍼. */
function createSubscribable<T>() {
  const listeners = new Map<string, Set<(items: T[]) => void>>();
  return {
    subscribe(key: string, snapshot: () => T[], callback: (items: T[]) => void) {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(callback);
      callback(snapshot());
      return () => {
        set!.delete(callback);
      };
    },
    notify(key: string, snapshot: () => T[]) {
      listeners.get(key)?.forEach((cb) => cb(snapshot()));
    },
  };
}

const ALL_HOUSES_KEY = '*';

export function createMemoryRepository(): Repository {
  const houses = new Map<string, House>();
  const floors = new Map<string, Floor>();
  const rooms = new Map<string, Room>();
  const furniturePieces = new Map<string, Furniture>();
  const bins = new Map<string, Bin>();
  const items = new Map<string, Item>();
  const photos = new Map<string, Photo>();

  const houseSubs = createSubscribable<House>();
  const floorSubs = createSubscribable<Floor>();
  const roomSubs = createSubscribable<Room>();
  const furnitureSubs = createSubscribable<Furniture>();
  const binSubs = createSubscribable<Bin>();
  const itemSubs = createSubscribable<Item>();

  async function removePhotoIfSet(photoId: string | null | undefined) {
    if (photoId) photos.delete(photoId);
  }

  const repository: Repository = {
    // 집
    async listHouses() {
      return [...houses.values()];
    },
    subscribeHouses(callback) {
      return houseSubs.subscribe(ALL_HOUSES_KEY, () => [...houses.values()], callback);
    },
    async getHouse(id) {
      return houses.get(id);
    },
    async createHouse(input) {
      const house: House = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      houses.set(house.id, house);
      houseSubs.notify(ALL_HOUSES_KEY, () => [...houses.values()]);
      return house;
    },
    async updateHouse(id, patch) {
      const existing = houses.get(id);
      if (!existing) throw new Error('집을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      houses.set(id, updated);
      houseSubs.notify(ALL_HOUSES_KEY, () => [...houses.values()]);
      return updated;
    },
    async removeHouse(id) {
      const childFloors = [...floors.values()].filter((f) => f.houseId === id);
      await Promise.all(childFloors.map((f) => repository.removeFloor(f.id)));
      houses.delete(id);
      houseSubs.notify(ALL_HOUSES_KEY, () => [...houses.values()]);
    },
    async joinHouse(code) {
      // 메모리 구현에는 기기별 멤버십 개념이 없다(집 목록이 이미 전부 보인다) — 존재 여부만 확인한다.
      return houses.get(code);
    },

    // 층
    async listFloors(houseId) {
      return [...floors.values()].filter((f) => f.houseId === houseId);
    },
    subscribeFloors(houseId, callback) {
      return floorSubs.subscribe(
        houseId,
        () => [...floors.values()].filter((f) => f.houseId === houseId),
        callback,
      );
    },
    async getFloor(id) {
      return floors.get(id);
    },
    async createFloor(input) {
      const floor: Floor = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      floors.set(floor.id, floor);
      floorSubs.notify(input.houseId, () => [...floors.values()].filter((f) => f.houseId === input.houseId));
      return floor;
    },
    async updateFloor(id, patch) {
      const existing = floors.get(id);
      if (!existing) throw new Error('층을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      floors.set(id, updated);
      floorSubs.notify(updated.houseId, () => [...floors.values()].filter((f) => f.houseId === updated.houseId));
      return updated;
    },
    async removeFloor(id) {
      const floor = floors.get(id);
      const childRooms = [...rooms.values()].filter((r) => r.floorId === id);
      await Promise.all(childRooms.map((r) => repository.removeRoom(r.id)));
      if (floor) await removePhotoIfSet(floor.planPhotoId);
      floors.delete(id);
      if (floor) {
        floorSubs.notify(floor.houseId, () => [...floors.values()].filter((f) => f.houseId === floor.houseId));
      }
    },

    // 방
    async listRooms(floorId) {
      return [...rooms.values()].filter((r) => r.floorId === floorId);
    },
    subscribeRooms(floorId, callback) {
      return roomSubs.subscribe(floorId, () => [...rooms.values()].filter((r) => r.floorId === floorId), callback);
    },
    async getRoom(id) {
      return rooms.get(id);
    },
    async createRoom(input) {
      const room: Room = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      rooms.set(room.id, room);
      roomSubs.notify(input.floorId, () => [...rooms.values()].filter((r) => r.floorId === input.floorId));
      return room;
    },
    async updateRoom(id, patch) {
      const existing = rooms.get(id);
      if (!existing) throw new Error('방을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      rooms.set(id, updated);
      roomSubs.notify(updated.floorId, () => [...rooms.values()].filter((r) => r.floorId === updated.floorId));
      return updated;
    },
    async removeRoom(id) {
      const room = rooms.get(id);
      const childFurniture = [...furniturePieces.values()].filter((f) => f.roomId === id);
      await Promise.all(childFurniture.map((f) => repository.removeFurniture(f.id)));
      rooms.delete(id);
      if (room) {
        roomSubs.notify(room.floorId, () => [...rooms.values()].filter((r) => r.floorId === room.floorId));
      }
    },

    // 가구
    async listFurniture(roomId) {
      return [...furniturePieces.values()].filter((f) => f.roomId === roomId);
    },
    subscribeFurniture(roomId, callback) {
      return furnitureSubs.subscribe(
        roomId,
        () => [...furniturePieces.values()].filter((f) => f.roomId === roomId),
        callback,
      );
    },
    async getFurniture(id) {
      return furniturePieces.get(id);
    },
    async createFurniture(input) {
      const piece: Furniture = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      furniturePieces.set(piece.id, piece);
      furnitureSubs.notify(input.roomId, () =>
        [...furniturePieces.values()].filter((f) => f.roomId === input.roomId),
      );
      return piece;
    },
    async updateFurniture(id, patch) {
      const existing = furniturePieces.get(id);
      if (!existing) throw new Error('가구를 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      furniturePieces.set(id, updated);
      furnitureSubs.notify(updated.roomId, () =>
        [...furniturePieces.values()].filter((f) => f.roomId === updated.roomId),
      );
      return updated;
    },
    async removeFurniture(id) {
      const piece = furniturePieces.get(id);
      const childBins = [...bins.values()].filter((b) => b.furnitureId === id);
      await Promise.all(childBins.map((b) => repository.removeBin(b.id)));
      if (piece) await removePhotoIfSet(piece.photoId);
      furniturePieces.delete(id);
      if (piece) {
        furnitureSubs.notify(piece.roomId, () =>
          [...furniturePieces.values()].filter((f) => f.roomId === piece.roomId),
        );
      }
    },

    // 보관함
    async listBins(furnitureId) {
      return [...bins.values()].filter((b) => b.furnitureId === furnitureId);
    },
    subscribeBins(furnitureId, callback) {
      return binSubs.subscribe(
        furnitureId,
        () => [...bins.values()].filter((b) => b.furnitureId === furnitureId),
        callback,
      );
    },
    async getBin(id) {
      return bins.get(id);
    },
    async createBin(input) {
      const bin: Bin = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      bins.set(bin.id, bin);
      binSubs.notify(input.furnitureId, () =>
        [...bins.values()].filter((b) => b.furnitureId === input.furnitureId),
      );
      return bin;
    },
    async updateBin(id, patch) {
      const existing = bins.get(id);
      if (!existing) throw new Error('보관함을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      bins.set(id, updated);
      binSubs.notify(updated.furnitureId, () =>
        [...bins.values()].filter((b) => b.furnitureId === updated.furnitureId),
      );
      return updated;
    },
    async removeBin(id) {
      const bin = bins.get(id);
      const childItems = [...items.values()].filter((i) => i.binId === id);
      await Promise.all(childItems.map((i) => repository.removeItem(i.id)));
      bins.delete(id);
      if (bin) {
        binSubs.notify(bin.furnitureId, () =>
          [...bins.values()].filter((b) => b.furnitureId === bin.furnitureId),
        );
      }
    },

    // 물건
    async listItems(binId) {
      return [...items.values()].filter((i) => i.binId === binId);
    },
    subscribeItems(binId, callback) {
      return itemSubs.subscribe(binId, () => [...items.values()].filter((i) => i.binId === binId), callback);
    },
    async getItem(id) {
      return items.get(id);
    },
    async createItem(input) {
      const item: Item = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      items.set(item.id, item);
      itemSubs.notify(input.binId, () => [...items.values()].filter((i) => i.binId === input.binId));
      return item;
    },
    async updateItem(id, patch) {
      const existing = items.get(id);
      if (!existing) throw new Error('물건을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      items.set(id, updated);
      itemSubs.notify(updated.binId, () => [...items.values()].filter((i) => i.binId === updated.binId));
      return updated;
    },
    async removeItem(id) {
      const item = items.get(id);
      if (item) await removePhotoIfSet(item.photoId);
      items.delete(id);
      if (item) {
        itemSubs.notify(item.binId, () => [...items.values()].filter((i) => i.binId === item.binId));
      }
    },

    // 사진 (parentId는 메모리 구현에서는 쓰지 않는다 — 모든 사진이 같은 메모리 공간에 있으니까)
    async getPhoto(id) {
      return photos.get(id);
    },
    async savePhoto(_parentId, dataUrl) {
      const photo: Photo = { id: makeId(), dataUrl, updatedAt: now() };
      photos.set(photo.id, photo);
      return photo;
    },
    async removePhoto(id) {
      photos.delete(id);
    },
  };

  return repository;
}
