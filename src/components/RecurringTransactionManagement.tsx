import { useState } from "react";
import { useRecurringTransactions, type RecurringTransaction, type FrequencyType } from "@/hooks/useRecurringTransactions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Repeat, Calendar, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";

const categories = {
  income: ["Gaji", "Freelance", "Bonus", "Investasi", "Lainnya"],
  expense: ["Makanan", "Transport", "Belanja", "Hiburan", "Tagihan", "Lainnya"],
};

const frequencyLabels = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

const schema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(100),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  next_run_date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().max(500).optional(),
});

export const RecurringTransactionManagement = () => {
  const {
    recurringTransactions,
    isLoading,
    createRecurringTransaction,
    updateRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction,
    isCreating,
  } = useRecurringTransactions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    frequency: "monthly" as FrequencyType,
    next_run_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      frequency: "monthly",
      next_run_date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
    setErrors({});
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category || "",
      frequency: transaction.frequency,
      next_run_date: transaction.next_run_date,
      notes: transaction.notes || "",
    });
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const parsedAmount = parseFloat(formData.amount);
      const validated = schema.parse({
        title: formData.title,
        amount: parsedAmount,
        type: formData.type,
        category: formData.category || undefined,
        frequency: formData.frequency,
        next_run_date: formData.next_run_date,
        notes: formData.notes || undefined,
      });

      if (editingTransaction) {
        updateRecurringTransaction({
          id: editingTransaction.id,
          title: validated.title,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          frequency: validated.frequency,
          next_run_date: validated.next_run_date,
          notes: validated.notes,
        });
      } else {
        createRecurringTransaction({
          title: validated.title,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          frequency: validated.frequency,
          next_run_date: validated.next_run_date,
          notes: validated.notes,
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Transaksi Berulang</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? "Edit Transaksi Berulang" : "Tambah Transaksi Berulang"}
              </DialogTitle>
              <DialogDescription>
                Transaksi akan otomatis dibuat sesuai jadwal yang ditentukan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>Tipe Transaksi</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as "income" | "expense", category: "" })}
                >
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="rec-income" />
                      <Label htmlFor="rec-income" className="cursor-pointer">Pemasukan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="rec-expense" />
                      <Label htmlFor="rec-expense" className="cursor-pointer">Pengeluaran</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="rec-title">Judul</Label>
                <Input
                  id="rec-title"
                  placeholder="Contoh: Tagihan listrik"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="rec-amount">Jumlah (Rp)</Label>
                <Input
                  id="rec-amount"
                  type="number"
                  placeholder="100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="rec-frequency">Frekuensi</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value as FrequencyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next Run Date */}
              <div className="space-y-2">
                <Label htmlFor="rec-date">Tanggal Mulai</Label>
                <Input
                  id="rec-date"
                  type="date"
                  value={formData.next_run_date}
                  onChange={(e) => setFormData({ ...formData, next_run_date: e.target.value })}
                  required
                />
                {errors.next_run_date && <p className="text-sm text-destructive">{errors.next_run_date}</p>}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="rec-category">Kategori (Opsional)</Label>
                <select
                  id="rec-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Pilih kategori</option>
                  {categories[formData.type].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="rec-notes">Catatan (Opsional)</Label>
                <Textarea
                  id="rec-notes"
                  placeholder="Tambahkan catatan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={isCreating}>
                  {isCreating ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recurring Transactions List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat...</div>
      ) : recurringTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Belum ada transaksi berulang</p>
          <p className="text-sm mt-1">Buat transaksi berulang untuk otomatisasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recurringTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                transaction.is_active ? "bg-card" : "bg-muted/30 opacity-60"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{transaction.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    transaction.type === "income" 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatCurrency(Number(transaction.amount)).replace("IDR", "Rp")}</span>
                  <span>•</span>
                  <span>{frequencyLabels[transaction.frequency]}</span>
                  <span>•</span>
                  <span>Next: {format(parseISO(transaction.next_run_date), "dd MMM yyyy", { locale: localeId })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={transaction.is_active}
                  onCheckedChange={(checked) =>
                    toggleRecurringTransaction({ id: transaction.id, is_active: checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(transaction)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirmId(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi Berulang?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi berulang akan dihapus dan tidak akan otomatis dibuat lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) deleteRecurringTransaction(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
