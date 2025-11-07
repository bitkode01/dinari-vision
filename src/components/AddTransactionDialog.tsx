import { useState, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { z } from "zod";

const transactionSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(100),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const categories = {
  income: ["Gaji", "Freelance", "Bonus", "Investasi", "Lainnya"],
  expense: ["Makanan", "Transport", "Belanja", "Hiburan", "Tagihan", "Lainnya"],
};

export const AddTransactionDialog = ({ 
  open, 
  onOpenChange,
  initialAmount 
}: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
  initialAmount?: number | null;
}) => {
  const { createTransaction, isCreating } = useTransactions();
  const [internalOpen, setInternalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use controlled state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  // Set amount when initialAmount changes
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount.toString());
      setType("expense");
    }
  }, [initialAmount]);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setType("expense");
    setCategory("");
    setNotes("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const parsedAmount = parseFloat(amount);
      const validated = transactionSchema.parse({
        title,
        amount: parsedAmount,
        type,
        category: category || undefined,
        notes: notes || undefined,
      });

      // CreateTransactionInput expects title, amount, type as required
      createTransaction({
        title: validated.title,
        amount: validated.amount,
        type: validated.type,
        category: validated.category,
        notes: validated.notes,
      });
      
      setOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full shadow-button"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Tipe Transaksi</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="cursor-pointer">
                    Pemasukan
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="cursor-pointer">
                    Pengeluaran
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              placeholder="Contoh: Beli kopi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori (Opsional)</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Pilih kategori</option>
              {categories[type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tambahkan catatan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
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
  );
};
