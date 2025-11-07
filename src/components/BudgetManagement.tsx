import { useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const categories = [
  "Makanan",
  "Transport",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Lainnya",
];

export const BudgetManagement = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ category: string; amount: number } | null>(
    null
  );

  const { budgets, isLoading, saveBudget, deleteBudget, isSaving } = useBudgets(
    selectedMonth,
    selectedYear
  );

  const [formData, setFormData] = useState({
    category: categories[0],
    amount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    saveBudget({
      category: formData.category,
      amount,
      month: selectedMonth,
      year: selectedYear,
    });

    setFormData({ category: categories[0], amount: "" });
    setEditingBudget(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (budget: any) => {
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
    });
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Budget Planning</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingBudget(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? "Edit Budget" : "Tambah Budget Baru"}
              </DialogTitle>
              <DialogDescription>
                Set target pengeluaran untuk kategori tertentu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  disabled={!!editingBudget}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Target Budget (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="500000"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingBudget(null);
                    setFormData({ category: categories[0], amount: "" });
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Period Selector */}
      <div className="flex gap-3 mb-4">
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {format(new Date(2024, month - 1), "MMMM", { locale: localeId })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Belum ada budget untuk periode ini
        </div>
      ) : (
        <div className="space-y-2">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{budget.category}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(budget.amount)).replace("IDR", "Rp")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(budget)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteBudget(budget.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
