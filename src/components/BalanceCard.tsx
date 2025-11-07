import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
}

export const BalanceCard = ({ balance }: BalanceCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-blue p-5 shadow-card animate-fade-in">
      <div className="flex items-start justify-between">
        <Wallet className="h-7 w-7 text-foreground/80" />
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-medium text-foreground/70">Saldo Total</p>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          {formatCurrency(balance).replace('IDR', 'Rp')}
        </h2>
        <p className="text-xs font-medium text-foreground/60">Update realtime ⚡</p>
      </div>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-foreground/5" />
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-foreground/5" />
    </div>
  );
};
