import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  type: "income" | "expense";
}

export const SummaryCard = ({ title, amount, icon: Icon, type }: SummaryCardProps) => {
  const colorClass = type === "income" ? "text-success" : "text-destructive";
  const bgColorClass = type === "income" ? "bg-success/10" : "bg-destructive/10";

  return (
    <div className="rounded-xl bg-card p-3 shadow-card animate-fade-in">
      <div className={`mb-2 inline-flex rounded-lg ${bgColorClass} p-2`}>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`mt-0.5 text-lg font-semibold ${colorClass} tracking-tight`}>
        {formatCurrency(amount).replace('IDR', 'Rp')}
      </p>
    </div>
  );
};
