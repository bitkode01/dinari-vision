import { Skeleton } from "@/components/ui/skeleton";

export const BalanceCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
};
