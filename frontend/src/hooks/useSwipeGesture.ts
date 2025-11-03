import { useRef, useEffect, RefObject } from 'react';
import { hapticFeedback } from '../utils/haptics';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for a swipe
  preventScroll?: boolean;
  enableHaptics?: boolean; // Enable haptic feedback on swipe
}

interface TouchPosition {
  x: number;
  y: number;
}

export function useSwipeGesture<T extends HTMLElement>(
  options: SwipeGestureOptions = {}
): RefObject<T> {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScroll = false,
    enableHaptics = true
  } = options;

  const elementRef = useRef<T>(null);
  const startPos = useRef<TouchPosition>({ x: 0, y: 0 });
  const endPos = useRef<TouchPosition>({ x: 0, y: 0 });
  const isSwiping = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      endPos.current = { x: touch.clientX, y: touch.clientY };
      isSwiping.current = true;

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;

      const touch = e.touches[0];
      endPos.current = { x: touch.clientX, y: touch.clientY };

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;

      const deltaX = endPos.current.x - startPos.current.x;
      const deltaY = endPos.current.y - startPos.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if it's a horizontal or vertical swipe
      if (Math.max(absDeltaX, absDeltaY) > threshold) {
        if (enableHaptics) {
          hapticFeedback.swipe();
        }
        
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      isSwiping.current = false;

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchCancel = () => {
      isSwiping.current = false;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll });
    element.addEventListener('touchcancel', handleTouchCancel);

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventScroll, enableHaptics]);

  return elementRef;
}