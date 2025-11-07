interface TransactionItemProps {
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

export const TransactionItem = ({ title, amount, type, date }: TransactionItemProps) => {
  const amountColor = type === "income" ? "text-success" : "text-destructive";
  const sign = type === "income" ? "+" : "-";

  return (
    <div className="flex items-center justify-between border-b border-border/50 py-3 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <p className={`text-lg font-semibold ${amountColor}`}>
        {sign} Rp {amount.toLocaleString('id-ID')}
      </p>
    </div>
  );
};
