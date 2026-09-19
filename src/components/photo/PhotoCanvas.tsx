import { useEffect, useRef, type ReactNode } from 'react';

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface PanGesture {
  mode: 'pan';
  startX: number;
  startY: number;
  startTime: number;
  moved: boolean;
  lastX: number;
  lastY: number;
}

interface PinchGesture {
  mode: 'pinch';
  startDistance: number;
  startScale: number;
}

interface ItemGesture {
  mode: 'item-candidate';
  itemId: string;
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
  longPressFired: boolean;
  dragging: boolean;
  timer: number;
}

interface HandleGesture {
  mode: 'handle';
  handleId: string;
  lastX: number;
  lastY: number;
}

type Gesture = PanGesture | PinchGesture | ItemGesture | HandleGesture;

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
  /** true면 data-hit-id 항목을 길게 누른 뒤 드래그로 이동, data-handle-id 항목을 바로 드래그해 크기 조절할 수 있다. */
  editable?: boolean;
  /** 이동 중 계속 호출된다. dx,dy는 이미지 기준 0~1 비율 변화량. */
  onItemMove?: (itemId: string, dx: number, dy: number) => void;
  onItemMoveEnd?: (itemId: string) => void;
  onHandleDrag?: (handleId: string, dx: number, dy: number) => void;
  onHandleDragEnd?: (handleId: string) => void;
}

const TAP_MOVE_THRESHOLD = 8;
const TAP_MAX_DURATION = 500;
const LONG_PRESS_MS = 800;

export function PhotoCanvas({
  imageUrl,
  overlay,
  onTapHit,
  onEmptyTap,
  resetKey,
  minScale = 1,
  maxScale = 4,
  editable = false,
  onItemMove,
  onItemMoveEnd,
  onHandleDrag,
  onHandleDragEnd,
}: PhotoCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 });
  const gestureRef = useRef<Gesture | null>(null);
  const naturalSizeRef = useRef<{ width: number; height: number } | null>(null);

  const onTapHitRef = useRef(onTapHit);
  const onEmptyTapRef = useRef(onEmptyTap);
  const onItemMoveRef = useRef(onItemMove);
  const onItemMoveEndRef = useRef(onItemMoveEnd);
  const onHandleDragRef = useRef(onHandleDrag);
  const onHandleDragEndRef = useRef(onHandleDragEnd);
  const editableRef = useRef(editable);
  const minScaleRef = useRef(minScale);
  const maxScaleRef = useRef(maxScale);
  onTapHitRef.current = onTapHit;
  onEmptyTapRef.current = onEmptyTap;
  onItemMoveRef.current = onItemMove;
  onItemMoveEndRef.current = onItemMoveEnd;
  onHandleDragRef.current = onHandleDrag;
  onHandleDragEndRef.current = onHandleDragEnd;
  editableRef.current = editable;
  minScaleRef.current = minScale;
  maxScaleRef.current = maxScale;

  function applyTransform() {
    const t = transformRef.current;
    if (innerRef.current) {
      innerRef.current.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    }
  }

  /** 도면이 화면 밖으로 완전히 벗어나지 않도록 팬/줌 결과를 이미지 경계 안으로 가둔다. */
  function clampTransform() {
    const outerRect = outerRef.current?.getBoundingClientRect();
    const natural = naturalSizeRef.current;
    if (!outerRect || outerRect.width === 0 || !natural || natural.width === 0) return;
    const t = transformRef.current;
    const baseHeight = outerRect.width * (natural.height / natural.width);
    const scaledWidth = outerRect.width * t.scale;
    const scaledHeight = baseHeight * t.scale;

    t.x =
      scaledWidth <= outerRect.width
        ? (outerRect.width - scaledWidth) / 2
        : Math.min(0, Math.max(outerRect.width - scaledWidth, t.x));
    t.y =
      scaledHeight <= outerRect.height
        ? (outerRect.height - scaledHeight) / 2
        : Math.min(0, Math.max(outerRect.height - scaledHeight, t.y));
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    naturalSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight };
    clampTransform();
    applyTransform();
  }

  useEffect(() => {
    transformRef.current = { scale: 1, x: 0, y: 0 };
    clampTransform();
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
        const target = touch.target as HTMLElement | null;

        if (editableRef.current) {
          const handleEl = target?.closest?.('[data-handle-id]') as HTMLElement | null;
          if (handleEl?.dataset.handleId) {
            gestureRef.current = {
              mode: 'handle',
              handleId: handleEl.dataset.handleId,
              lastX: touch.clientX,
              lastY: touch.clientY,
            };
            return;
          }
          const dragEl = target?.closest?.('[data-hit-id]') as HTMLElement | null;
          if (dragEl?.dataset.hitId) {
            const gesture: ItemGesture = {
              mode: 'item-candidate',
              itemId: dragEl.dataset.hitId,
              startX: touch.clientX,
              startY: touch.clientY,
              startTime: Date.now(),
              lastX: touch.clientX,
              lastY: touch.clientY,
              longPressFired: false,
              dragging: false,
              timer: 0,
            };
            gesture.timer = window.setTimeout(() => {
              if (gestureRef.current === gesture) {
                gesture.longPressFired = true;
              }
            }, LONG_PRESS_MS);
            gestureRef.current = gesture;
            return;
          }
        }

        gestureRef.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
          moved: false,
          lastX: touch.clientX,
          lastY: touch.clientY,
        };
      } else if (e.touches.length === 2) {
        const prev = gestureRef.current;
        if (prev?.mode === 'item-candidate') window.clearTimeout(prev.timer);
        const [t0, t1] = [e.touches[0], e.touches[1]];
        gestureRef.current = {
          mode: 'pinch',
          startDistance: distance(t0, t1),
          startScale: transformRef.current.scale,
        };
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (gesture.mode === 'pan' && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - gesture.lastX;
        const dy = touch.clientY - gesture.lastY;
        const totalMoved = Math.hypot(touch.clientX - gesture.startX, touch.clientY - gesture.startY);
        if (totalMoved > TAP_MOVE_THRESHOLD) gesture.moved = true;
        gesture.lastX = touch.clientX;
        gesture.lastY = touch.clientY;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        clampTransform();
        applyTransform();
      } else if (gesture.mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        const [t0, t1] = [e.touches[0], e.touches[1]];
        const newDistance = distance(t0, t1);
        const mid = midpoint(t0, t1);
        const rawScale = gesture.startScale * (newDistance / (gesture.startDistance || 1));
        const newScale = Math.min(maxScaleRef.current, Math.max(minScaleRef.current, rawScale));

        const outerRect = outerRef.current?.getBoundingClientRect();
        if (outerRect) {
          // 확대 기준점은 항상 "지금 이 프레임"의 손가락 중점을 써야 흔들리지 않는다
          // (제스처 시작 시점의 좌표를 계속 쓰면 매 프레임 오차가 누적돼 화면이 떠다닌다).
          const t = transformRef.current;
          const contentX = (mid.x - outerRect.left - t.x) / t.scale;
          const contentY = (mid.y - outerRect.top - t.y) / t.scale;
          t.x = mid.x - outerRect.left - contentX * newScale;
          t.y = mid.y - outerRect.top - contentY * newScale;
          t.scale = newScale;
          clampTransform();
          applyTransform();
        }
      } else if (gesture.mode === 'item-candidate' && e.touches.length === 1) {
        const touch = e.touches[0];
        const totalMoved = Math.hypot(touch.clientX - gesture.startX, touch.clientY - gesture.startY);
        if (!gesture.longPressFired) {
          if (totalMoved > TAP_MOVE_THRESHOLD) {
            window.clearTimeout(gesture.timer);
            gestureRef.current = null;
          }
          return;
        }
        if (!gesture.dragging && totalMoved > TAP_MOVE_THRESHOLD) gesture.dragging = true;
        if (gesture.dragging) {
          e.preventDefault();
          const rect = imgRef.current?.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            const dx = (touch.clientX - gesture.lastX) / rect.width;
            const dy = (touch.clientY - gesture.lastY) / rect.height;
            gesture.lastX = touch.clientX;
            gesture.lastY = touch.clientY;
            onItemMoveRef.current?.(gesture.itemId, dx, dy);
          }
        }
      } else if (gesture.mode === 'handle' && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = imgRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          const dx = (touch.clientX - gesture.lastX) / rect.width;
          const dy = (touch.clientY - gesture.lastY) / rect.height;
          gesture.lastX = touch.clientX;
          gesture.lastY = touch.clientY;
          onHandleDragRef.current?.(gesture.handleId, dx, dy);
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture) return;
      if (e.touches.length > 0) return;

      if (gesture.mode === 'handle') {
        onHandleDragEndRef.current?.(gesture.handleId);
        return;
      }

      if (gesture.mode === 'item-candidate') {
        window.clearTimeout(gesture.timer);
        if (gesture.dragging) {
          onItemMoveEndRef.current?.(gesture.itemId);
          return;
        }
        onTapHitRef.current?.(gesture.itemId);
        return;
      }

      if (gesture.mode !== 'pan') return;
      const duration = Date.now() - gesture.startTime;
      if (!gesture.moved && duration < TAP_MAX_DURATION) {
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
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-full w-full touch-none overflow-hidden bg-[#E6E9EF]"
    >
      <div ref={innerRef} className="relative w-full origin-top-left">
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          className="hsm-no-callout block w-full select-none ring-1 ring-line"
          draggable={false}
          onLoad={handleImageLoad}
        />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {overlay}
        </svg>
      </div>
    </div>
  );
}
