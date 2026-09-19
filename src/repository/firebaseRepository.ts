import { equalTo, get, onValue, orderByChild, query, ref, remove, update, type Database } from 'firebase/database';
import type { Bin, Floor, Furniture, House, Item, Photo, Room } from '@/types';
import type { Repository } from './types';
import { generateId } from '@/lib/id';
import { getAuthReady, getFirebaseDb } from '@/firebase/app';
import { isConnected, watchFirebaseConnection } from '@/firebase/connection';
import { addDeviceHouseId, getDeviceHouseIds, removeDeviceHouseId } from '@/lib/deviceHouses';

const MAX_PHOTO_STRING_LENGTH = 1.5 * 1024 * 1024;

function now() {
  return Date.now();
}

function assertOnline() {
  if (!isConnected()) {
    throw new Error('인터넷 연결이 필요해요.');
  }
}

/** Firebase는 쓰기 값에 undefined가 섞이면 예외를 던진다. undefined는 "필드 삭제"인 null로 바꾼다. */
function sanitize(patch: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    result[key] = value === undefined ? null : value;
  }
  return result;
}

function objectToArray<T>(val: unknown, mapper: (id: string, raw: Record<string, unknown>) => T): T[] {
  if (!val || typeof val !== 'object') return [];
  return Object.entries(val as Record<string, Record<string, unknown>>).map(([id, raw]) => mapper(id, raw));
}

// ---- Firebase raw 값 <-> 앱 타입 매핑 ----
function toHouse(id: string, v: Record<string, unknown>): House {
  return {
    id,
    name: v.name as string,
    ownerUid: v.ownerUid as string,
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
}
function toFloor(id: string, v: Record<string, unknown>): Floor {
  return {
    id,
    houseId: v.houseId as string,
    name: v.name as string,
    order: v.order as number,
    planPhotoId: (v.planPhotoId as string | null) ?? null,
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
}
function toRoom(id: string, v: Record<string, unknown>): Room {
  return {
    id,
    floorId: v.floorId as string,
    name: v.name as string,
    points: (v.points as Room['points']) ?? [],
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
}
function toFurniture(id: string, v: Record<string, unknown>): Furniture {
  return {
    id,
    roomId: v.roomId as string,
    name: v.name as string,
    photoId: (v.photoId as string | null) ?? null,
    x: v.x as number,
    y: v.y as number,
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
}
function toBin(id: string, v: Record<string, unknown>): Bin {
  return {
    id,
    furnitureId: v.furnitureId as string,
    name: v.name as string,
    x: v.x as number,
    y: v.y as number,
    w: v.w as number,
    h: v.h as number,
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
}
function toItem(id: string, v: Record<string, unknown>): Item {
  return {
    id,
    binId: v.binId as string,
    name: v.name as string,
    emoji: v.emoji as string | undefined,
    photoId: (v.photoId as string | null | undefined) ?? null,
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
}

async function recompressDataUrl(dataUrl: string, quality: number): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close();
  }
}

/** 저장할 문자열이 1.5MB를 넘으면 품질을 낮춰가며 다시 압축한다. */
async function shrinkForStorage(dataUrl: string): Promise<string> {
  let result = dataUrl;
  let quality = 0.75;
  while (result.length > MAX_PHOTO_STRING_LENGTH && quality > 0.3) {
    result = await recompressDataUrl(result, quality);
    quality -= 0.15;
  }
  return result;
}

// ---- 하위 삭제 경로 모으기 (부모 삭제 시 update() 한 번으로 처리하기 위해) ----
async function collectBinDeletion(
  db: Database,
  houseId: string,
  bin: Bin,
  paths: Record<string, null>,
  photoIds: Set<string>,
) {
  paths[`houses/${houseId}/bins/${bin.id}`] = null;
  paths[`entityIndex/${bin.id}`] = null;

  const itemsSnap = await get(query(ref(db, `houses/${houseId}/items`), orderByChild('binId'), equalTo(bin.id)));
  for (const item of objectToArray(itemsSnap.val(), toItem)) {
    paths[`houses/${houseId}/items/${item.id}`] = null;
    paths[`entityIndex/${item.id}`] = null;
    if (item.photoId) photoIds.add(item.photoId);
  }
}

async function collectFurnitureDeletion(
  db: Database,
  houseId: string,
  furniture: Furniture,
  paths: Record<string, null>,
  photoIds: Set<string>,
) {
  paths[`houses/${houseId}/furniture/${furniture.id}`] = null;
  paths[`entityIndex/${furniture.id}`] = null;
  if (furniture.photoId) photoIds.add(furniture.photoId);

  const binsSnap = await get(
    query(ref(db, `houses/${houseId}/bins`), orderByChild('furnitureId'), equalTo(furniture.id)),
  );
  for (const bin of objectToArray(binsSnap.val(), toBin)) {
    await collectBinDeletion(db, houseId, bin, paths, photoIds);
  }
}

async function collectRoomDeletion(
  db: Database,
  houseId: string,
  room: Room,
  paths: Record<string, null>,
  photoIds: Set<string>,
) {
  paths[`houses/${houseId}/rooms/${room.id}`] = null;
  paths[`entityIndex/${room.id}`] = null;

  const furnitureSnap = await get(
    query(ref(db, `houses/${houseId}/furniture`), orderByChild('roomId'), equalTo(room.id)),
  );
  for (const furniture of objectToArray(furnitureSnap.val(), toFurniture)) {
    await collectFurnitureDeletion(db, houseId, furniture, paths, photoIds);
  }
}

export function createFirebaseRepository(): Repository {
  const db = getFirebaseDb();
  watchFirebaseConnection();

  // 방/가구/보관함/물건/사진은 houseId 없이 id만으로 들어오므로(인터페이스가 그렇게 생겼다),
  // "이 id가 어느 집 소속인지" 전역 색인에서 찾는다. 생성 시 함께 기록하고, 한 번 찾으면 캐시한다.
  const entityHouseCache = new Map<string, string>();

  async function resolveHouseId(entityId: string): Promise<string> {
    const cached = entityHouseCache.get(entityId);
    if (cached) return cached;
    const snap = await get(ref(db, `entityIndex/${entityId}`));
    const houseId = snap.val();
    if (typeof houseId !== 'string') throw new Error('연결된 집을 찾을 수 없어요.');
    entityHouseCache.set(entityId, houseId);
    return houseId;
  }

  function subscribeByParent<T>(
    parentId: string,
    path: (houseId: string) => string,
    field: string,
    mapper: (id: string, raw: Record<string, unknown>) => T,
    callback: (items: T[]) => void,
  ): () => void {
    let unsub: (() => void) | null = null;
    let cancelled = false;
    resolveHouseId(parentId)
      .then((houseId) => {
        if (cancelled) return;
        const q = query(ref(db, path(houseId)), orderByChild(field), equalTo(parentId));
        unsub = onValue(q, (snap) => callback(objectToArray(snap.val(), mapper)));
      })
      .catch(() => callback([]));
    return () => {
      cancelled = true;
      unsub?.();
    };
  }

  const photoCache = new Map<string, Photo>();

  const repository: Repository = {
    // 집
    async listHouses() {
      const ids = getDeviceHouseIds();
      const snaps = await Promise.all(ids.map((id) => get(ref(db, `houses/${id}`))));
      return snaps
        .map((snap, i) => (snap.exists() ? toHouse(ids[i], snap.val()) : null))
        .filter((h): h is House => h !== null);
    },
    subscribeHouses(callback) {
      const ids = getDeviceHouseIds();
      if (ids.length === 0) {
        callback([]);
        return () => {};
      }
      const current = new Map<string, House>();
      const unsubs = ids.map((id) =>
        onValue(ref(db, `houses/${id}`), (snap) => {
          if (snap.exists()) current.set(id, toHouse(id, snap.val()));
          else current.delete(id);
          callback([...current.values()]);
        }),
      );
      return () => unsubs.forEach((u) => u());
    },
    async getHouse(id) {
      const snap = await get(ref(db, `houses/${id}`)).catch(() => null);
      return snap?.exists() ? toHouse(id, snap.val()) : undefined;
    },
    async createHouse(input) {
      assertOnline();
      const uid = await getAuthReady();
      const id = generateId();
      const ts = now();
      await update(ref(db), {
        [`houses/${id}/name`]: input.name,
        [`houses/${id}/ownerUid`]: input.ownerUid,
        [`houses/${id}/createdAt`]: ts,
        [`houses/${id}/updatedAt`]: ts,
        [`houses/${id}/members/${uid}`]: true,
      });
      addDeviceHouseId(id);
      return { id, name: input.name, ownerUid: input.ownerUid, createdAt: ts, updatedAt: ts };
    },
    async updateHouse(id, patch) {
      assertOnline();
      const ts = now();
      await update(ref(db, `houses/${id}`), { ...sanitize(patch), updatedAt: ts });
      const snap = await get(ref(db, `houses/${id}`));
      if (!snap.exists()) throw new Error('집을 찾을 수 없습니다.');
      return toHouse(id, snap.val());
    },
    async removeHouse(id) {
      assertOnline();
      await remove(ref(db, `houses/${id}`));
      removeDeviceHouseId(id);
      // 하위 항목의 entityIndex 항목은 정리하지 않고 남겨둔다(임시 규칙 단계의 의도적 단순화).
      // 존재하지 않는 houseId를 가리키게 될 뿐이라 다시 조회되어도 "찾을 수 없음"으로 안전하게 끝난다.
    },
    async joinHouse(code, uid) {
      assertOnline();
      const snap = await get(ref(db, `houses/${code}`));
      if (!snap.exists()) return undefined;
      await update(ref(db), { [`houses/${code}/members/${uid}`]: true });
      addDeviceHouseId(code);
      return toHouse(code, snap.val());
    },

    // 층
    async listFloors(houseId) {
      const snap = await get(ref(db, `houses/${houseId}/floors`)).catch(() => null);
      return objectToArray(snap?.val(), toFloor);
    },
    subscribeFloors(houseId, callback) {
      return onValue(ref(db, `houses/${houseId}/floors`), (snap) => {
        callback(objectToArray(snap.val(), toFloor));
      });
    },
    async getFloor(id) {
      const houseId = await resolveHouseId(id).catch(() => null);
      if (!houseId) return undefined;
      const snap = await get(ref(db, `houses/${houseId}/floors/${id}`));
      return snap.exists() ? toFloor(id, snap.val()) : undefined;
    },
    async createFloor(input) {
      assertOnline();
      const id = generateId();
      const ts = now();
      const data = {
        houseId: input.houseId,
        name: input.name,
        order: input.order,
        planPhotoId: input.planPhotoId,
        createdAt: ts,
        updatedAt: ts,
      };
      await update(ref(db), {
        [`houses/${input.houseId}/floors/${id}`]: data,
        [`entityIndex/${id}`]: input.houseId,
      });
      entityHouseCache.set(id, input.houseId);
      return { id, ...data };
    },
    async updateFloor(id, patch) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const ts = now();
      await update(ref(db, `houses/${houseId}/floors/${id}`), { ...sanitize(patch), updatedAt: ts });
      const snap = await get(ref(db, `houses/${houseId}/floors/${id}`));
      if (!snap.exists()) throw new Error('층을 찾을 수 없습니다.');
      return toFloor(id, snap.val());
    },
    async removeFloor(id) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const floorSnap = await get(ref(db, `houses/${houseId}/floors/${id}`));
      const paths: Record<string, null> = { [`houses/${houseId}/floors/${id}`]: null, [`entityIndex/${id}`]: null };
      const photoIds = new Set<string>();
      if (floorSnap.exists()) {
        const floor = toFloor(id, floorSnap.val());
        if (floor.planPhotoId) photoIds.add(floor.planPhotoId);
      }

      const roomsSnap = await get(query(ref(db, `houses/${houseId}/rooms`), orderByChild('floorId'), equalTo(id)));
      for (const room of objectToArray(roomsSnap.val(), toRoom)) {
        await collectRoomDeletion(db, houseId, room, paths, photoIds);
      }
      for (const photoId of photoIds) {
        paths[`houses/${houseId}/photos/${photoId}`] = null;
        paths[`entityIndex/${photoId}`] = null;
      }
      await update(ref(db), paths);
      entityHouseCache.delete(id);
    },

    // 방
    async listRooms(floorId) {
      const houseId = await resolveHouseId(floorId).catch(() => null);
      if (!houseId) return [];
      const snap = await get(query(ref(db, `houses/${houseId}/rooms`), orderByChild('floorId'), equalTo(floorId)));
      return objectToArray(snap.val(), toRoom);
    },
    subscribeRooms(floorId, callback) {
      return subscribeByParent(floorId, (h) => `houses/${h}/rooms`, 'floorId', toRoom, callback);
    },
    async getRoom(id) {
      const houseId = await resolveHouseId(id).catch(() => null);
      if (!houseId) return undefined;
      const snap = await get(ref(db, `houses/${houseId}/rooms/${id}`));
      return snap.exists() ? toRoom(id, snap.val()) : undefined;
    },
    async createRoom(input) {
      assertOnline();
      const houseId = await resolveHouseId(input.floorId);
      const id = generateId();
      const ts = now();
      const data = { floorId: input.floorId, name: input.name, points: input.points, createdAt: ts, updatedAt: ts };
      await update(ref(db), {
        [`houses/${houseId}/rooms/${id}`]: data,
        [`entityIndex/${id}`]: houseId,
      });
      entityHouseCache.set(id, houseId);
      return { id, ...data };
    },
    async updateRoom(id, patch) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const ts = now();
      await update(ref(db, `houses/${houseId}/rooms/${id}`), { ...sanitize(patch), updatedAt: ts });
      const snap = await get(ref(db, `houses/${houseId}/rooms/${id}`));
      if (!snap.exists()) throw new Error('방을 찾을 수 없습니다.');
      return toRoom(id, snap.val());
    },
    async removeRoom(id) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const snap = await get(ref(db, `houses/${houseId}/rooms/${id}`));
      if (!snap.exists()) {
        entityHouseCache.delete(id);
        return;
      }
      const paths: Record<string, null> = {};
      const photoIds = new Set<string>();
      await collectRoomDeletion(db, houseId, toRoom(id, snap.val()), paths, photoIds);
      for (const photoId of photoIds) {
        paths[`houses/${houseId}/photos/${photoId}`] = null;
        paths[`entityIndex/${photoId}`] = null;
      }
      await update(ref(db), paths);
      entityHouseCache.delete(id);
    },

    // 가구
    async listFurniture(roomId) {
      const houseId = await resolveHouseId(roomId).catch(() => null);
      if (!houseId) return [];
      const snap = await get(query(ref(db, `houses/${houseId}/furniture`), orderByChild('roomId'), equalTo(roomId)));
      return objectToArray(snap.val(), toFurniture);
    },
    subscribeFurniture(roomId, callback) {
      return subscribeByParent(roomId, (h) => `houses/${h}/furniture`, 'roomId', toFurniture, callback);
    },
    async getFurniture(id) {
      const houseId = await resolveHouseId(id).catch(() => null);
      if (!houseId) return undefined;
      const snap = await get(ref(db, `houses/${houseId}/furniture/${id}`));
      return snap.exists() ? toFurniture(id, snap.val()) : undefined;
    },
    async createFurniture(input) {
      assertOnline();
      const houseId = await resolveHouseId(input.roomId);
      const id = generateId();
      const ts = now();
      const data = {
        roomId: input.roomId,
        name: input.name,
        photoId: input.photoId,
        x: input.x,
        y: input.y,
        createdAt: ts,
        updatedAt: ts,
      };
      await update(ref(db), {
        [`houses/${houseId}/furniture/${id}`]: data,
        [`entityIndex/${id}`]: houseId,
      });
      entityHouseCache.set(id, houseId);
      return { id, ...data };
    },
    async updateFurniture(id, patch) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const ts = now();
      await update(ref(db, `houses/${houseId}/furniture/${id}`), { ...sanitize(patch), updatedAt: ts });
      const snap = await get(ref(db, `houses/${houseId}/furniture/${id}`));
      if (!snap.exists()) throw new Error('가구를 찾을 수 없습니다.');
      return toFurniture(id, snap.val());
    },
    async removeFurniture(id) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const snap = await get(ref(db, `houses/${houseId}/furniture/${id}`));
      if (!snap.exists()) {
        entityHouseCache.delete(id);
        return;
      }
      const paths: Record<string, null> = {};
      const photoIds = new Set<string>();
      await collectFurnitureDeletion(db, houseId, toFurniture(id, snap.val()), paths, photoIds);
      for (const photoId of photoIds) {
        paths[`houses/${houseId}/photos/${photoId}`] = null;
        paths[`entityIndex/${photoId}`] = null;
      }
      await update(ref(db), paths);
      entityHouseCache.delete(id);
    },

    // 보관함
    async listBins(furnitureId) {
      const houseId = await resolveHouseId(furnitureId).catch(() => null);
      if (!houseId) return [];
      const snap = await get(
        query(ref(db, `houses/${houseId}/bins`), orderByChild('furnitureId'), equalTo(furnitureId)),
      );
      return objectToArray(snap.val(), toBin);
    },
    subscribeBins(furnitureId, callback) {
      return subscribeByParent(furnitureId, (h) => `houses/${h}/bins`, 'furnitureId', toBin, callback);
    },
    async getBin(id) {
      const houseId = await resolveHouseId(id).catch(() => null);
      if (!houseId) return undefined;
      const snap = await get(ref(db, `houses/${houseId}/bins/${id}`));
      return snap.exists() ? toBin(id, snap.val()) : undefined;
    },
    async createBin(input) {
      assertOnline();
      const houseId = await resolveHouseId(input.furnitureId);
      const id = generateId();
      const ts = now();
      const data = {
        furnitureId: input.furnitureId,
        name: input.name,
        x: input.x,
        y: input.y,
        w: input.w,
        h: input.h,
        createdAt: ts,
        updatedAt: ts,
      };
      await update(ref(db), {
        [`houses/${houseId}/bins/${id}`]: data,
        [`entityIndex/${id}`]: houseId,
      });
      entityHouseCache.set(id, houseId);
      return { id, ...data };
    },
    async updateBin(id, patch) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const ts = now();
      await update(ref(db, `houses/${houseId}/bins/${id}`), { ...sanitize(patch), updatedAt: ts });
      const snap = await get(ref(db, `houses/${houseId}/bins/${id}`));
      if (!snap.exists()) throw new Error('보관함을 찾을 수 없습니다.');
      return toBin(id, snap.val());
    },
    async removeBin(id) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const snap = await get(ref(db, `houses/${houseId}/bins/${id}`));
      if (!snap.exists()) {
        entityHouseCache.delete(id);
        return;
      }
      const paths: Record<string, null> = {};
      const photoIds = new Set<string>();
      await collectBinDeletion(db, houseId, toBin(id, snap.val()), paths, photoIds);
      for (const photoId of photoIds) {
        paths[`houses/${houseId}/photos/${photoId}`] = null;
        paths[`entityIndex/${photoId}`] = null;
      }
      await update(ref(db), paths);
      entityHouseCache.delete(id);
    },

    // 물건
    async listItems(binId) {
      const houseId = await resolveHouseId(binId).catch(() => null);
      if (!houseId) return [];
      const snap = await get(query(ref(db, `houses/${houseId}/items`), orderByChild('binId'), equalTo(binId)));
      return objectToArray(snap.val(), toItem);
    },
    subscribeItems(binId, callback) {
      return subscribeByParent(binId, (h) => `houses/${h}/items`, 'binId', toItem, callback);
    },
    async getItem(id) {
      const houseId = await resolveHouseId(id).catch(() => null);
      if (!houseId) return undefined;
      const snap = await get(ref(db, `houses/${houseId}/items/${id}`));
      return snap.exists() ? toItem(id, snap.val()) : undefined;
    },
    async createItem(input) {
      assertOnline();
      const houseId = await resolveHouseId(input.binId);
      const id = generateId();
      const ts = now();
      const data: Record<string, unknown> = { binId: input.binId, name: input.name, createdAt: ts, updatedAt: ts };
      if (input.emoji !== undefined) data.emoji = input.emoji;
      if (input.photoId !== undefined && input.photoId !== null) data.photoId = input.photoId;
      await update(ref(db), {
        [`houses/${houseId}/items/${id}`]: data,
        [`entityIndex/${id}`]: houseId,
      });
      entityHouseCache.set(id, houseId);
      return {
        id,
        binId: input.binId,
        name: input.name,
        emoji: input.emoji,
        photoId: input.photoId ?? null,
        createdAt: ts,
        updatedAt: ts,
      };
    },
    async updateItem(id, patch) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const ts = now();
      await update(ref(db, `houses/${houseId}/items/${id}`), { ...sanitize(patch), updatedAt: ts });
      const snap = await get(ref(db, `houses/${houseId}/items/${id}`));
      if (!snap.exists()) throw new Error('물건을 찾을 수 없습니다.');
      return toItem(id, snap.val());
    },
    async removeItem(id) {
      assertOnline();
      const houseId = await resolveHouseId(id);
      const snap = await get(ref(db, `houses/${houseId}/items/${id}`));
      const paths: Record<string, null> = {
        [`houses/${houseId}/items/${id}`]: null,
        [`entityIndex/${id}`]: null,
      };
      if (snap.exists()) {
        const item = toItem(id, snap.val());
        if (item.photoId) {
          paths[`houses/${houseId}/photos/${item.photoId}`] = null;
          paths[`entityIndex/${item.photoId}`] = null;
        }
      }
      await update(ref(db), paths);
      entityHouseCache.delete(id);
    },

    // 사진 — 세션 동안 메모리에 캐시하고, 필요할 때만 불러온다. 구독하지 않는다.
    async getPhoto(id) {
      const cached = photoCache.get(id);
      if (cached) return cached;
      const houseId = await resolveHouseId(id).catch(() => null);
      if (!houseId) return undefined;
      const snap = await get(ref(db, `houses/${houseId}/photos/${id}`));
      if (!snap.exists()) return undefined;
      const raw = snap.val();
      const photo: Photo = { id, dataUrl: raw.dataUrl, updatedAt: raw.updatedAt };
      photoCache.set(id, photo);
      return photo;
    },
    async savePhoto(parentId, dataUrl) {
      assertOnline();
      const houseId = await resolveHouseId(parentId);
      const finalDataUrl = await shrinkForStorage(dataUrl);
      const id = generateId();
      const ts = now();
      await update(ref(db), {
        [`houses/${houseId}/photos/${id}`]: { dataUrl: finalDataUrl, updatedAt: ts },
        [`entityIndex/${id}`]: houseId,
      });
      entityHouseCache.set(id, houseId);
      const photo: Photo = { id, dataUrl: finalDataUrl, updatedAt: ts };
      photoCache.set(id, photo);
      return photo;
    },
    async removePhoto(id) {
      assertOnline();
      photoCache.delete(id);
      const houseId = await resolveHouseId(id).catch(() => null);
      entityHouseCache.delete(id);
      if (!houseId) return;
      await update(ref(db), {
        [`houses/${houseId}/photos/${id}`]: null,
        [`entityIndex/${id}`]: null,
      });
    },
  };

  return repository;
}
