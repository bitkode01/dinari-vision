import { LucideIcon } from "lucide-react";

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
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className={`mb-3 inline-flex rounded-xl ${bgColorClass} p-2`}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>
        Rp {amount.toLocaleString('id-ID')}
      </p>
    </div>
  );
};
