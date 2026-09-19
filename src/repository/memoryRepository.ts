import type { Bin, Floor, Furniture, House, Item, Photo, Room } from '@/types';
import type { Repository } from './types';
import { generateId } from '@/lib/id';

function now() {
  return Date.now();
}

function makeId() {
  return generateId();
}

export function createMemoryRepository(): Repository {
  const houses = new Map<string, House>();
  const floors = new Map<string, Floor>();
  const rooms = new Map<string, Room>();
  const furniturePieces = new Map<string, Furniture>();
  const bins = new Map<string, Bin>();
  const items = new Map<string, Item>();
  const photos = new Map<string, Photo>();

  async function removePhotoIfSet(photoId: string | null | undefined) {
    if (photoId) photos.delete(photoId);
  }

  const repository: Repository = {
    // 집
    async listHouses() {
      return [...houses.values()];
    },
    async getHouse(id) {
      return houses.get(id);
    },
    async createHouse(input) {
      const house: House = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      houses.set(house.id, house);
      return house;
    },
    async updateHouse(id, patch) {
      const existing = houses.get(id);
      if (!existing) throw new Error('집을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      houses.set(id, updated);
      return updated;
    },
    async removeHouse(id) {
      const childFloors = [...floors.values()].filter((f) => f.houseId === id);
      await Promise.all(childFloors.map((f) => repository.removeFloor(f.id)));
      houses.delete(id);
    },

    // 층
    async listFloors(houseId) {
      return [...floors.values()].filter((f) => f.houseId === houseId);
    },
    async getFloor(id) {
      return floors.get(id);
    },
    async createFloor(input) {
      const floor: Floor = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      floors.set(floor.id, floor);
      return floor;
    },
    async updateFloor(id, patch) {
      const existing = floors.get(id);
      if (!existing) throw new Error('층을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      floors.set(id, updated);
      return updated;
    },
    async removeFloor(id) {
      const floor = floors.get(id);
      const childRooms = [...rooms.values()].filter((r) => r.floorId === id);
      await Promise.all(childRooms.map((r) => repository.removeRoom(r.id)));
      if (floor) await removePhotoIfSet(floor.planPhotoId);
      floors.delete(id);
    },

    // 방
    async listRooms(floorId) {
      return [...rooms.values()].filter((r) => r.floorId === floorId);
    },
    async getRoom(id) {
      return rooms.get(id);
    },
    async createRoom(input) {
      const room: Room = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      rooms.set(room.id, room);
      return room;
    },
    async updateRoom(id, patch) {
      const existing = rooms.get(id);
      if (!existing) throw new Error('방을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      rooms.set(id, updated);
      return updated;
    },
    async removeRoom(id) {
      const childFurniture = [...furniturePieces.values()].filter((f) => f.roomId === id);
      await Promise.all(childFurniture.map((f) => repository.removeFurniture(f.id)));
      rooms.delete(id);
    },

    // 가구
    async listFurniture(roomId) {
      return [...furniturePieces.values()].filter((f) => f.roomId === roomId);
    },
    async getFurniture(id) {
      return furniturePieces.get(id);
    },
    async createFurniture(input) {
      const piece: Furniture = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      furniturePieces.set(piece.id, piece);
      return piece;
    },
    async updateFurniture(id, patch) {
      const existing = furniturePieces.get(id);
      if (!existing) throw new Error('가구를 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      furniturePieces.set(id, updated);
      return updated;
    },
    async removeFurniture(id) {
      const piece = furniturePieces.get(id);
      const childBins = [...bins.values()].filter((b) => b.furnitureId === id);
      await Promise.all(childBins.map((b) => repository.removeBin(b.id)));
      if (piece) await removePhotoIfSet(piece.photoId);
      furniturePieces.delete(id);
    },

    // 보관함
    async listBins(furnitureId) {
      return [...bins.values()].filter((b) => b.furnitureId === furnitureId);
    },
    async getBin(id) {
      return bins.get(id);
    },
    async createBin(input) {
      const bin: Bin = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      bins.set(bin.id, bin);
      return bin;
    },
    async updateBin(id, patch) {
      const existing = bins.get(id);
      if (!existing) throw new Error('보관함을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      bins.set(id, updated);
      return updated;
    },
    async removeBin(id) {
      const childItems = [...items.values()].filter((i) => i.binId === id);
      await Promise.all(childItems.map((i) => repository.removeItem(i.id)));
      bins.delete(id);
    },

    // 물건
    async listItems(binId) {
      return [...items.values()].filter((i) => i.binId === binId);
    },
    async getItem(id) {
      return items.get(id);
    },
    async createItem(input) {
      const item: Item = { id: makeId(), createdAt: now(), updatedAt: now(), ...input };
      items.set(item.id, item);
      return item;
    },
    async updateItem(id, patch) {
      const existing = items.get(id);
      if (!existing) throw new Error('물건을 찾을 수 없습니다.');
      const updated = { ...existing, ...patch, updatedAt: now() };
      items.set(id, updated);
      return updated;
    },
    async removeItem(id) {
      const item = items.get(id);
      if (item) await removePhotoIfSet(item.photoId);
      items.delete(id);
    },

    // 사진
    async getPhoto(id) {
      return photos.get(id);
    },
    async savePhoto(dataUrl) {
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
