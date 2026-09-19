import { useEffect, useRef, type ReactNode } from 'react';

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface Gesture {
  mode: 'pan' | 'pinch';
  startX: number;
  startY: number;
  startTime: number;
  moved: boolean;
  lastX: number;
  lastY: number;
  startDistance: number;
  startScale: number;
  startMidX: number;
  startMidY: number;
}

interface PhotoCanvasProps {
  imageUrl: string;
  overlay?: ReactNode;
  /** viewBox 0 0 100 100 기준 오버레이에서 data-hit-id가 붙은 도형을 탭했을 때 */
  onTapHit?: (hitId: string) => void;
  /** 도형이 아닌 빈 곳을 탭했을 때, 이미지 기준 0~1 비율 좌표 */
  onEmptyTap?: (point: { x: number; y: number }) => void;
  /** 이 값이 바뀌면 확대/이동 상태를 초기화한다. */
  resetKey?: string | number;
  minScale?: number;
  maxScale?: number;
}

const TAP_MOVE_THRESHOLD = 8;
const TAP_MAX_DURATION = 500;

export function PhotoCanvas({
  imageUrl,
  overlay,
  onTapHit,
  onEmptyTap,
  resetKey,
  minScale = 1,
  maxScale = 4,
}: PhotoCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 });
  const gestureRef = useRef<Gesture | null>(null);

  const onTapHitRef = useRef(onTapHit);
  const onEmptyTapRef = useRef(onEmptyTap);
  const minScaleRef = useRef(minScale);
  const maxScaleRef = useRef(maxScale);
  onTapHitRef.current = onTapHit;
  onEmptyTapRef.current = onEmptyTap;
  minScaleRef.current = minScale;
  maxScaleRef.current = maxScale;

  function applyTransform() {
    const t = transformRef.current;
    if (innerRef.current) {
      innerRef.current.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }
  }

  useEffect(() => {
    transformRef.current = { scale: 1, x: 0, y: 0 };
    applyTransform();
  }, [resetKey]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    function distance(a: Touch, b: Touch) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    function midpoint(a: Touch, b: Touch) {
      return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        gestureRef.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
          moved: false,
          lastX: touch.clientX,
          lastY: touch.clientY,
          startDistance: 0,
          startScale: transformRef.current.scale,
          startMidX: 0,
          startMidY: 0,
        };
      } else if (e.touches.length === 2) {
        const [t0, t1] = [e.touches[0], e.touches[1]];
        const mid = midpoint(t0, t1);
        gestureRef.current = {
          mode: 'pinch',
          startX: 0,
          startY: 0,
          startTime: Date.now(),
          moved: true,
          lastX: 0,
          lastY: 0,
          startDistance: distance(t0, t1),
          startScale: transformRef.current.scale,
          startMidX: mid.x,
          startMidY: mid.y,
        };
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const gesture = gestureRef.current;
      if (!gesture) return;
      e.preventDefault();

      if (gesture.mode === 'pan' && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - gesture.lastX;
        const dy = touch.clientY - gesture.lastY;
        const totalMoved = Math.hypot(touch.clientX - gesture.startX, touch.clientY - gesture.startY);
        if (totalMoved > TAP_MOVE_THRESHOLD) gesture.moved = true;
        gesture.lastX = touch.clientX;
        gesture.lastY = touch.clientY;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        applyTransform();
      } else if (gesture.mode === 'pinch' && e.touches.length === 2) {
        const [t0, t1] = [e.touches[0], e.touches[1]];
        const newDistance = distance(t0, t1);
        const mid = midpoint(t0, t1);
        const rawScale = gesture.startScale * (newDistance / (gesture.startDistance || 1));
        const newScale = Math.min(maxScaleRef.current, Math.max(minScaleRef.current, rawScale));

        const outerRect = outerRef.current?.getBoundingClientRect();
        if (outerRect) {
          const t = transformRef.current;
          const contentX = (gesture.startMidX - outerRect.left - t.x) / t.scale;
          const contentY = (gesture.startMidY - outerRect.top - t.y) / t.scale;
          t.x = mid.x - outerRect.left - contentX * newScale;
          t.y = mid.y - outerRect.top - contentY * newScale;
          t.scale = newScale;
          applyTransform();
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture) return;
      if (e.touches.length > 0) return;

      const duration = Date.now() - gesture.startTime;
      if (gesture.mode === 'pan' && !gesture.moved && duration < TAP_MAX_DURATION) {
        const touch = e.changedTouches[0];
        const target = touch.target as HTMLElement | null;
        const hitEl = target?.closest?.('[data-hit-id]') as HTMLElement | null;
        if (hitEl?.dataset.hitId) {
          onTapHitRef.current?.(hitEl.dataset.hitId);
          return;
        }
        const rect = imgRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const nx = (touch.clientX - rect.left) / rect.width;
        const ny = (touch.clientY - rect.top) / rect.height;
        if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
        onEmptyTapRef.current?.({ x: nx, y: ny });
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-slate-900"
    >
      <div ref={innerRef} className="relative w-full origin-top-left">
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          className="block w-full select-none"
          draggable={false}
        />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {overlay}
        </svg>
      </div>
    </div>
  );
}
