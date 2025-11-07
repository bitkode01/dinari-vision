import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { BalanceCard } from "@/components/BalanceCard";
import { SummaryCard } from "@/components/SummaryCard";
import { FeatureButton } from "@/components/FeatureButton";
import { TransactionItem } from "@/components/TransactionItem";
import { BottomNav } from "@/components/BottomNav";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { TrendingUp, TrendingDown, Camera, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";

const Index = () => {
  const { user } = useAuth();
  const { transactions, isLoading, summary, deleteTransaction } = useTransactions();
  const [activeTab, setActiveTab] = useState("home");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedAmount, setScannedAmount] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!user,
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!user) {
      window.location.href = "/auth";
    }
  }, [user]);

  // Get recent transactions (top 4)
  const recentTransactions = transactions.slice(0, 4);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeleteConfirmId(null);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "add") {
      setAddDialogOpen(true);
    }
    setActiveTab(tab);
  };

  const handleAmountDetected = (amount: number) => {
    setScannedAmount(amount);
    setAddDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-foreground">Dinari Wallet</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {profile?.full_name || 'User'}! 👋
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6 px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <BalanceCard balance={summary.balance} />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <SummaryCard
                title="Pemasukan"
                amount={summary.income}
                icon={TrendingUp}
                type="income"
              />
              <SummaryCard
                title="Pengeluaran"
                amount={summary.expense}
                icon={TrendingDown}
                type="expense"
              />
            </div>
          </>
        )}

        {/* Feature Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <FeatureButton
            title="Scan Struk"
            description="Scan otomatis dengan OCR"
            icon={Camera}
            gradient="purple"
            onClick={() => setScannerOpen(true)}
          />
          <FeatureButton
            title="Pengaturan"
            description="Kelola akun Anda"
            icon={FileText}
            gradient="blue"
            onClick={() => navigate("/settings")}
          />
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Transaksi Terbaru</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => navigate("/history")}
            >
              Lihat Semua
            </Button>
          </div>
          <div className="space-y-1">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Memuat transaksi...
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada transaksi. Mulai tambahkan transaksi pertama Anda!
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  id={transaction.id}
                  title={transaction.title}
                  amount={Number(transaction.amount)}
                  type={transaction.type}
                  category={transaction.category}
                  date={formatDistanceToNow(new Date(transaction.date), {
                    addSuffix: true,
                    locale: localeId,
                  })}
                  onEdit={() => setEditingTransaction(transaction)}
                  onDelete={() => setDeleteConfirmId(transaction.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Floating Add Button */}
      <AddTransactionDialog 
        open={addDialogOpen} 
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setScannedAmount(null);
        }}
        initialAmount={scannedAmount}
      />

      {/* Receipt Scanner */}
      <ReceiptScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onAmountDetected={handleAmountDetected}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction}
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
