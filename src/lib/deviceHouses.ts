const STORAGE_KEY = 'hsm.deviceHouseIds';

/**
 * 이 기기가 만들었거나 속한 집 id 목록. Firebase에는 집을 가로지르는 사용자별 색인이 없으므로
 * "메인에 어떤 집을 보여줄지"는 기기에 보관한 이 목록을 기준으로 한다.
 */
export function getDeviceHouseIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function addDeviceHouseId(id: string): void {
  try {
    const ids = getDeviceHouseIds();
    if (!ids.includes(id)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
    }
  } catch {
    // 로컬 저장 실패는 무시한다 — 이번 방문에서 집 목록이 안 보일 뿐 앱은 계속 동작해야 한다.
  }
}

export function removeDeviceHouseId(id: string): void {
  try {
    const ids = getDeviceHouseIds().filter((x) => x !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}
