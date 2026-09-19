import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { Furniture } from '@/types';
import { FURNITURE_CARD } from '@/styles/entity';

const LONG_PRESS_MS = 800;
const MOVE_THRESHOLD = 8;

interface FurnitureCardProps {
  furniture: Furniture;
  photoUrl: string | null;
  /** 스크롤 컨테이너(화면에 보이는 높이는 항상 고정) — x/y 비율과 드래그 계산 기준. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** containerRef의 고정 높이(px). y*viewportHeightPx로 세로 위치를 계산한다. */
  viewportHeightPx: number;
  blinking?: boolean;
  onTap: () => void;
  onDragEnd: (x: number, y: number) => void;
  onLongPressSelect: () => void;
}

interface GestureState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  dx: number;
  dy: number;
  longPressFired: boolean;
  dragging: boolean;
  timer: number;
}

export function FurnitureCard({
  furniture,
  photoUrl,
  containerRef,
  viewportHeightPx,
  blinking = false,
  onTap,
  onDragEnd,
  onLongPressSelect,
}: FurnitureCardProps) {
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  const gestureRef = useRef<GestureState | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const gesture: GestureState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      dx: 0,
      dy: 0,
      longPressFired: false,
      dragging: false,
      timer: 0,
    };
    gesture.timer = window.setTimeout(() => {
      if (gestureRef.current === gesture) gesture.longPressFired = true;
    }, LONG_PRESS_MS);
    gestureRef.current = gesture;
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    const totalMoved = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);
    if (!gesture.longPressFired) {
      if (totalMoved > MOVE_THRESHOLD) {
        window.clearTimeout(gesture.timer);
        gestureRef.current = null;
      }
      return;
    }
    if (!gesture.dragging && totalMoved > MOVE_THRESHOLD) gesture.dragging = true;
    if (gesture.dragging) {
      gesture.dx += e.clientX - gesture.lastX;
      gesture.dy += e.clientY - gesture.lastY;
      gesture.lastX = e.clientX;
      gesture.lastY = e.clientY;
      setDragOffset({ dx: gesture.dx, dy: gesture.dy });
    }
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    window.clearTimeout(gesture.timer);
    gestureRef.current = null;

    if (gesture.dragging) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        const nx = Math.min(0.97, Math.max(0.03, furniture.x + gesture.dx / rect.width));
        // 세로는 스크롤로 더 내려갈 수 있으니 위쪽만 제한하고 아래쪽은 막지 않는다.
        const ny = Math.max(0.03, furniture.y + gesture.dy / rect.height);
        onDragEnd(nx, ny);
      }
      setDragOffset(null);
    } else if (gesture.longPressFired) {
      onLongPressSelect();
    } else {
      onTap();
    }
  }

  const style: CSSProperties = {
    left: `${furniture.x * 100}%`,
    top: `${furniture.y * viewportHeightPx}px`,
    transform: `translate(-50%, -50%) translate(${dragOffset?.dx ?? 0}px, ${dragOffset?.dy ?? 0}px)`,
  };

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      className={`absolute flex w-24 touch-none select-none flex-col items-center rounded-3xl border-2 p-1.5 ${
        blinking ? 'hsm-blink-card' : FURNITURE_CARD.normal
      }`}
    >
      <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-white">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="hsm-no-callout h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="text-2xl">🪑</span>
        )}
      </div>
      <p className="mt-1 w-full truncate text-center text-[13px] font-medium text-ink">{furniture.name}</p>
    </div>
  );
}
