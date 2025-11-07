import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { BalanceCard } from "@/components/BalanceCard";
import { SummaryCard } from "@/components/SummaryCard";
import { FeatureButton } from "@/components/FeatureButton";
import { TransactionItem } from "@/components/TransactionItem";
import { BottomNav } from "@/components/BottomNav";
import { TrendingUp, TrendingDown, Camera, FileText, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

const Index = () => {
  const { user, signOut } = useAuth();
  const { transactions, isLoading, summary } = useTransactions();
  const [activeTab, setActiveTab] = useState("home");

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!user) {
      window.location.href = "/auth";
    }
  }, [user]);

  // Get recent transactions (top 4)
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-foreground">Dinari Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola keuangan dengan mudah</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-muted-foreground hover:text-destructive"
          title="Keluar"
        >
          <LogOut className="h-5 w-5" />
        </Button>
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
            description="Input transaksi dari foto"
            icon={Camera}
            gradient="purple"
            onClick={() => console.log("Scan struk")}
          />
          <FeatureButton
            title="Semua Riwayat"
            description="Lihat semua transaksi"
            icon={FileText}
            gradient="blue"
            onClick={() => console.log("Lihat riwayat")}
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
              onClick={() => console.log("Lihat semua")}
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
                  title={transaction.title}
                  amount={Number(transaction.amount)}
                  type={transaction.type}
                  date={formatDistanceToNow(new Date(transaction.date), {
                    addSuffix: true,
                    locale: localeId,
                  })}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
