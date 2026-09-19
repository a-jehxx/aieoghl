import { useEffect, useState } from 'react';
import { repository } from '@/repository';
import type { House } from '@/types';
import { useNavigationStore } from '@/store/navigationStore';
import { EmptyState } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';

export function MainScreen() {
  const [houses, setHouses] = useState<House[] | null>(null);
  const push = useNavigationStore((s) => s.push);

  useEffect(() => {
    let active = true;
    repository.listHouses().then((list) => {
      if (active) setHouses(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const goToAddHouse = () => push({ type: 'placeholder', title: '집 추가' });

  if (houses === null) {
    return <Loading />;
  }

  if (houses.length === 0) {
    return (
      <EmptyState
        title="아직 등록된 집이 없어요"
        description="집을 추가하고 도면을 등록하면 물건 위치를 기록할 수 있어요."
        actionLabel="집 추가하기"
        onAction={goToAddHouse}
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {houses.map((house) => (
        <li key={house.id}>
          <button
            type="button"
            onClick={() => push({ type: 'placeholder', title: house.name })}
            className="flex h-16 w-full items-center px-4 text-left text-base font-medium text-slate-900 active:bg-slate-50"
          >
            {house.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
