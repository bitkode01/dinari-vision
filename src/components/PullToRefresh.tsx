import { ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export const PullToRefresh = ({
  children,
  pullDistance,
  isRefreshing,
  progress,
  containerRef,
  handlers,
}: PullToRefreshProps) => {
  return (
    <div
      ref={containerRef}
      className="relative h-screen overflow-y-auto"
      {...handlers}
    >
      {/* Pull Indicator */}
      <div
        className="absolute left-0 right-0 top-0 z-50 flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-1 transition-transform",
            pullDistance > 0 && "translate-y-0",
            pullDistance === 0 && "-translate-y-full"
          )}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium text-primary">Memuat ulang...</span>
            </>
          ) : (
            <>
              <div
                className="relative h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
                style={{
                  transform: `rotate(${progress * 1.8}deg)`,
                }}
              >
                <ArrowDown className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {progress >= 100 ? "Lepas untuk refresh" : "Tarik untuk refresh"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
