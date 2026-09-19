export interface Point {
  x: number;
  y: number;
}

export interface House {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  ownerUid: string;
  /** 가족 공유 코드(8자리). 공유 중이 아니면 null. */
  shareCode: string | null;
}

export interface Floor {
  id: string;
  createdAt: number;
  updatedAt: number;
  houseId: string;
  name: string;
  order: number;
  planPhotoId: string | null;
}

export interface Room {
  id: string;
  createdAt: number;
  updatedAt: number;
  floorId: string;
  name: string;
  points: Point[];
}

export interface Furniture {
  id: string;
  createdAt: number;
  updatedAt: number;
  roomId: string;
  name: string;
  photoId: string | null;
  x: number;
  y: number;
}

export interface Bin {
  id: string;
  createdAt: number;
  updatedAt: number;
  furnitureId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Item {
  id: string;
  createdAt: number;
  updatedAt: number;
  binId: string;
  name: string;
  emoji?: string;
  photoId?: string | null;
}

export interface Photo {
  id: string;
  dataUrl: string;
  updatedAt: number;
}
