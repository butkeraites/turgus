import { useRef, useEffect, RefObject, useState } from 'react';
import { hapticFeedback } from '../utils/haptics';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance to trigger refresh
  resistance?: number; // Resistance factor (0-1)
  enabled?: boolean;
  enableHaptics?: boolean; // Enable haptic feedback
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh<T extends HTMLElement>(
  options: PullToRefreshOptions
): [RefObject<T>, PullToRefreshState] {
  const {
    onRefresh,
    threshold = 80,
    resistance = 0.5,
    enabled = true,
    enableHaptics = true
  } = options;

  const elementRef = useRef<T>(null);
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull-to-refresh if we're at the top of the page
      if (element.scrollTop > 0) return;

      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (element.scrollTop > 0) return;

      const touch = e.touches[0];
      currentY.current = touch.clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        // Pulling down
        isPulling.current = true;
        const pullDistance = Math.min(deltaY * resistance, threshold * 1.5);
        
        setState(prev => ({
          ...prev,
          isPulling: true,
          pullDistance
        }));

        // Prevent default scrolling when pulling
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      const deltaY = currentY.current - startY.current;
      const pullDistance = deltaY * resistance;

      if (pullDistance >= threshold) {
        // Trigger refresh with haptic feedback
        if (enableHaptics) {
          hapticFeedback.pullToRefresh();
        }
        
        setState(prev => ({
          ...prev,
          isRefreshing: true,
          pullDistance: threshold
        }));

        try {
          await onRefresh();
          if (enableHaptics) {
            hapticFeedback.success();
          }
        } catch (error) {
          console.error('Pull to refresh error:', error);
          if (enableHaptics) {
            hapticFeedback.error();
          }
        }

        setState(prev => ({
          ...prev,
          isRefreshing: false,
          isPulling: false,
          pullDistance: 0
        }));
      } else {
        // Reset state
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0
        }));
      }

      isPulling.current = false;
    };

    const handleTouchCancel = () => {
      isPulling.current = false;
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0
      }));
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onRefresh, threshold, resistance, enabled, enableHaptics]);

  return [elementRef, state];
}