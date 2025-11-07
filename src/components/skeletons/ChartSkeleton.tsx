import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface ChartSkeletonProps {
  title?: string;
  height?: number;
}

export const ChartSkeleton = ({ title, height = 250 }: ChartSkeletonProps) => {
  return (
    <Card className="p-5">
      {title && (
        <Skeleton className="h-6 w-48 mb-4" />
      )}
      <Skeleton className="w-full rounded-lg" style={{ height: `${height}px` }} />
    </Card>
  );
};
