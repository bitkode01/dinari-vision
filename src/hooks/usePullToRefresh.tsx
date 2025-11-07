import { useState, useRef, useCallback, TouchEvent } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start tracking if we're at the top of the scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].pageY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing || !containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      
      // Only allow pull-to-refresh when scrolled to top
      if (scrollTop > 0) {
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].pageY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        // Apply resistance to make it feel natural
        const resistedDistance = Math.min(distance / resistance, threshold * 1.5);
        setPullDistance(resistedDistance);
        
        // Prevent default scrolling when pulling
        if (resistedDistance > 10) {
          e.preventDefault();
        }
      }
    },
    [isRefreshing, threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh error:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        startY.current = 0;
      }
    } else {
      setPullDistance(0);
      startY.current = 0;
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);

  return {
    pullDistance,
    isRefreshing,
    progress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    containerRef,
  };
};
