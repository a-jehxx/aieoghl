interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">이 화면은 다음 작업에서 만들 예정이에요.</p>
    </div>
  );
}
