import { useState } from "react";
import { BalanceCard } from "@/components/BalanceCard";
import { SummaryCard } from "@/components/SummaryCard";
import { FeatureButton } from "@/components/FeatureButton";
import { TransactionItem } from "@/components/TransactionItem";
import { BottomNav } from "@/components/BottomNav";
import { TrendingUp, TrendingDown, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  // Sample data
  const balance = 10500;
  const income = 38000;
  const expense = 27500;

  const recentTransactions = [
    { id: 1, title: "Beli kopi di kafe Batu", amount: 15000, type: "expense" as const, date: "Hari ini, 14:30" },
    { id: 2, title: "Gaji bulanan", amount: 5000000, type: "income" as const, date: "Kemarin, 09:00" },
    { id: 3, title: "Belanja bulanan", amount: 250000, type: "expense" as const, date: "2 hari lalu" },
    { id: 4, title: "Freelance project", amount: 1500000, type: "income" as const, date: "3 hari lalu" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">Dinari Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola keuangan dengan mudah</p>
      </div>

      {/* Main Content */}
      <div className="space-y-6 px-6">
        {/* Balance Card */}
        <BalanceCard balance={balance} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            title="Pemasukan"
            amount={income}
            icon={TrendingUp}
            type="income"
          />
          <SummaryCard
            title="Pengeluaran"
            amount={expense}
            icon={TrendingDown}
            type="expense"
          />
        </div>

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
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                title={transaction.title}
                amount={transaction.amount}
                type={transaction.type}
                date={transaction.date}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
