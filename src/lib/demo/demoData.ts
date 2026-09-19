/**
 * 체험 모드 샘플 집의 방 → 가구 → 보관함 → 물건 내용. floorLayout.ts의 zone key와
 * furnitureAssets.ts의 furniture key를 참조해서, 도면·가구 그림과 실제로 등록되는
 * 데이터가 같은 이름을 쓰게 한다.
 */

export interface DemoItemSpec {
  name: string;
  emoji: string;
}

export interface DemoBinSpec {
  /** furnitureAssets.ts의 해당 가구 bins 배열에 있는 이름과 똑같아야 한다. */
  binName: string;
  items: DemoItemSpec[];
}

export interface DemoRoomFurnitureSpec {
  /** furnitureAssets.ts의 DemoFurniturePiece key */
  furnitureKey: string;
  /** 방 캔버스 위 카드 위치(0~1). 0.15~0.85 범위, 가구끼리 겹치지 않게 잡는다. */
  x: number;
  y: number;
  bins: DemoBinSpec[];
}

export interface DemoRoomSpec {
  /** floorLayout.ts의 DemoZone key (registered: true인 것만) */
  zoneKey: string;
  furniture: DemoRoomFurnitureSpec[];
}

export const DEMO_ROOMS: DemoRoomSpec[] = [
  {
    zoneKey: 'entrance',
    furniture: [
      {
        furnitureKey: 'shoeCabinet',
        x: 0.5,
        y: 0.5,
        bins: [
          { binName: '위 칸', items: [{ name: '우산', emoji: '☂️' }, { name: '장갑', emoji: '🧤' }] },
          {
            binName: '서랍',
            items: [
              { name: '여분 열쇠', emoji: '🔑' },
              { name: '마스크', emoji: '😷' },
              { name: '손전등', emoji: '🔦' },
            ],
          },
        ],
      },
    ],
  },
  {
    zoneKey: 'livingRoom',
    furniture: [
      {
        furnitureKey: 'tvStand',
        x: 0.3,
        y: 0.3,
        bins: [
          { binName: '서랍 1', items: [{ name: '리모컨', emoji: '🎛️' }, { name: '건전지', emoji: '🔋' }] },
          { binName: '서랍 2', items: [{ name: '충전기', emoji: '🔌' }, { name: '이어폰', emoji: '🎧' }] },
          { binName: '선반', items: [{ name: '보드게임', emoji: '🎲' }] },
        ],
      },
      {
        furnitureKey: 'drawerChest',
        x: 0.7,
        y: 0.3,
        bins: [
          {
            binName: '위 칸',
            items: [
              { name: '상비약', emoji: '💊' },
              { name: '체온계', emoji: '🌡️' },
              { name: '밴드', emoji: '🩹' },
            ],
          },
          { binName: '아래 칸', items: [{ name: '여분 휴지', emoji: '🧻' }, { name: '핸드크림', emoji: '🧴' }] },
        ],
      },
    ],
  },
  {
    zoneKey: 'kitchen',
    furniture: [
      {
        furnitureKey: 'kitchenCabinet',
        x: 0.5,
        y: 0.5,
        bins: [
          { binName: '서랍 1', items: [{ name: '가위', emoji: '✂️' }, { name: '수저', emoji: '🥄' }] },
          { binName: '서랍 2', items: [{ name: '키친타월', emoji: '🧻' }, { name: '양념', emoji: '🧂' }] },
          { binName: '하부문', items: [{ name: '냄비', emoji: '🍲' }, { name: '프라이팬', emoji: '🍳' }] },
        ],
      },
    ],
  },
  {
    zoneKey: 'pantry',
    furniture: [
      {
        furnitureKey: 'pantryShelf',
        x: 0.5,
        y: 0.5,
        bins: [
          { binName: '위 단', items: [{ name: '라면', emoji: '🍜' }, { name: '과자', emoji: '🍪' }] },
          { binName: '가운데 단', items: [{ name: '통조림', emoji: '🥫' }, { name: '꿀', emoji: '🍯' }] },
          { binName: '아래 단', items: [{ name: '쌀', emoji: '🍚' }, { name: '생수', emoji: '💧' }] },
        ],
      },
    ],
  },
  {
    zoneKey: 'utility',
    furniture: [
      {
        furnitureKey: 'utilityCabinet',
        x: 0.5,
        y: 0.5,
        bins: [
          {
            binName: '서랍',
            items: [
              { name: '드라이버', emoji: '🔧' },
              { name: '망치', emoji: '🔨' },
              { name: '건전지', emoji: '🔋' },
            ],
          },
          { binName: '문칸', items: [{ name: '세제', emoji: '🧴' }, { name: '전구', emoji: '💡' }] },
        ],
      },
    ],
  },
  {
    zoneKey: 'mainRoom',
    furniture: [
      {
        furnitureKey: 'wardrobe',
        x: 0.3,
        y: 0.3,
        bins: [
          { binName: '서랍 1', items: [{ name: '양말', emoji: '🧦' }, { name: '목도리', emoji: '🧣' }] },
          { binName: '서랍 2', items: [{ name: '여권', emoji: '🛂' }, { name: '서류철', emoji: '📄' }] },
        ],
      },
      {
        furnitureKey: 'vanity',
        x: 0.7,
        y: 0.3,
        bins: [{ binName: '서랍', items: [{ name: '화장품', emoji: '💄' }, { name: '빗', emoji: '🪮' }] }],
      },
    ],
  },
  {
    zoneKey: 'dressRoom',
    furniture: [
      {
        furnitureKey: 'dressChest',
        x: 0.5,
        y: 0.5,
        bins: [
          { binName: '1칸', items: [{ name: '티셔츠', emoji: '👕' }] },
          { binName: '2칸', items: [{ name: '바지', emoji: '👖' }] },
          { binName: '3칸', items: [{ name: '모자', emoji: '🧢' }] },
          { binName: '4칸', items: [{ name: '반바지', emoji: '🩳' }] },
        ],
      },
    ],
  },
  {
    zoneKey: 'kidsRoom',
    furniture: [
      {
        furnitureKey: 'kidsDeskChest',
        x: 0.5,
        y: 0.5,
        bins: [
          { binName: '서랍 1', items: [{ name: '볼펜심', emoji: '🖊️' }, { name: '색연필', emoji: '🖍️' }] },
          { binName: '서랍 2', items: [{ name: '공책', emoji: '📓' }, { name: '계산기', emoji: '🧮' }] },
          { binName: '서랍 3', items: [{ name: '물감', emoji: '🎨' }] },
        ],
      },
    ],
  },
  {
    zoneKey: 'study',
    furniture: [
      {
        furnitureKey: 'studyDesk',
        x: 0.3,
        y: 0.3,
        bins: [
          { binName: '서랍 1', items: [{ name: '볼펜심', emoji: '🖊️' }, { name: '포스트잇', emoji: '📝' }] },
          { binName: '서랍 2', items: [{ name: '가위', emoji: '✂️' }, { name: '클립', emoji: '📎' }] },
          { binName: '서랍 3', items: [{ name: '충전기', emoji: '🔌' }, { name: '외장하드', emoji: '💾' }] },
        ],
      },
      {
        furnitureKey: 'bookshelf',
        x: 0.7,
        y: 0.3,
        bins: [
          { binName: '위 칸', items: [{ name: '책', emoji: '📚' }] },
          { binName: '아래 칸', items: [{ name: '서류 파일', emoji: '🗂️' }] },
        ],
      },
    ],
  },
];
