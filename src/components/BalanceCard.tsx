import { Wallet } from "lucide-react";

interface BalanceCardProps {
  balance: number;
}

export const BalanceCard = ({ balance }: BalanceCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-blue p-6 shadow-card">
      <div className="flex items-start justify-between">
        <Wallet className="h-8 w-8 text-foreground/80" />
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-foreground/70">Saldo Total</p>
        <h2 className="text-4xl font-bold text-foreground">
          Rp {balance.toLocaleString('id-ID')}
        </h2>
        <p className="text-xs text-foreground/60">Update realtime</p>
      </div>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-foreground/5" />
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-foreground/5" />
    </div>
  );
};
