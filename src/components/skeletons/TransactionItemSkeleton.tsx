import { Skeleton } from "@/components/ui/skeleton";

export const TransactionItemSkeleton = () => {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0 rounded-lg px-1.5">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="ml-2">
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
};
