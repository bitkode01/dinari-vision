import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface TransactionItemProps {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TransactionItem = ({ 
  id, 
  title, 
  amount, 
  type, 
  date, 
  category,
  onEdit,
  onDelete 
}: TransactionItemProps) => {
  const amountColor = type === "income" ? "text-success" : "text-destructive";
  const sign = type === "income" ? "+" : "-";

  return (
    <div className="group flex items-center justify-between border-b border-border/50 py-3 last:border-0 hover:bg-muted/30 transition-colors rounded-lg px-2">
      <div className="flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{date}</p>
          {category && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{category}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-lg font-semibold ${amountColor}`}>
          {sign} {formatCurrency(amount).replace('IDR', 'Rp')}
        </p>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
