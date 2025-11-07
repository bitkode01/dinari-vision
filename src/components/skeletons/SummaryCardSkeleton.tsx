import { Skeleton } from "@/components/ui/skeleton";

export const SummaryCardSkeleton = () => {
  return (
    <div className="rounded-xl bg-card p-3 shadow-card">
      <Skeleton className="h-8 w-8 rounded-lg mb-2" />
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-6 w-28" />
    </div>
  );
};
