import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefresh } from "@/components/PullToRefresh";
import { TransactionItem } from "@/components/TransactionItem";
import { TransactionItemSkeleton } from "@/components/skeletons/TransactionItemSkeleton";
import { BottomNav } from "@/components/BottomNav";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, X, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, parseISO, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const categories = [
  "Semua",
  "Gaji",
  "Freelance",
  "Bonus",
  "Investasi",
  "Makanan",
  "Transport",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Lainnya",
];

type DateFilter = "all" | "today" | "week" | "month" | "custom";

const History = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { transactions, isLoading, deleteTransaction } = useTransactions();
  const [activeTab, setActiveTab] = useState("history");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Filter states
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [displayCount, setDisplayCount] = useState(20);

  // Pull to refresh handler
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success("Data berhasil dimuat ulang");
  };

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Category filter
    if (categoryFilter !== "Semua") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      filtered = filtered.filter((t) => {
        const transactionDate = parseISO(t.date);
        
        switch (dateFilter) {
          case "today":
            return isToday(transactionDate);
          case "week":
            return isThisWeek(transactionDate, { locale: localeId });
          case "month":
            return isThisMonth(transactionDate);
          case "custom":
            if (!customStartDate || !customEndDate) return true;
            const start = parseISO(customStartDate);
            const end = parseISO(customEndDate);
            return transactionDate >= start && transactionDate <= end;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [transactions, categoryFilter, dateFilter, customStartDate, customEndDate]);

  // Infinite scroll
  const displayedTransactions = filteredTransactions.slice(0, displayCount);
  const hasMore = displayCount < filteredTransactions.length;

  const loadMore = () => {
    setDisplayCount((prev) => prev + 20);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeleteConfirmId(null);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "add") {
      setAddDialogOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const clearFilters = () => {
    setDateFilter("all");
    setCategoryFilter("Semua");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const activeFiltersCount = 
    (dateFilter !== "all" ? 1 : 0) + 
    (categoryFilter !== "Semua" ? 1 : 0);

  return (
    <PullToRefresh
      pullDistance={pullToRefresh.pullDistance}
      isRefreshing={pullToRefresh.isRefreshing}
      progress={pullToRefresh.progress}
      containerRef={pullToRefresh.containerRef}
      handlers={pullToRefresh.handlers}
    >
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Riwayat</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredTransactions.length} transaksi
              </p>
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-5 w-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filter Transaksi</SheetTitle>
                  <SheetDescription>
                    Filter berdasarkan tanggal dan kategori
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Date Filter */}
                  <div className="space-y-3">
                    <Label>Filter Tanggal</Label>
                    <Select
                      value={dateFilter}
                      onValueChange={(value) => setDateFilter(value as DateFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih periode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Waktu</SelectItem>
                        <SelectItem value="today">Hari Ini</SelectItem>
                        <SelectItem value="week">Minggu Ini</SelectItem>
                        <SelectItem value="month">Bulan Ini</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Date Range */}
                  {dateFilter === "custom" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Dari Tanggal</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Sampai Tanggal</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <Label>Filter Kategori</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

                  {/* Clear Filters */}
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        clearFilters();
                        toast.success("Filter dihapus");
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Hapus Semua Filter
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <TransactionItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {activeFiltersCount > 0
                ? "Tidak ada transaksi yang sesuai dengan filter"
                : "Belum ada transaksi"}
            </p>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Hapus Filter
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {displayedTransactions.map((transaction) => (
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
            ))}

            {/* Load More Button */}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={loadMore}
              >
                Muat Lebih Banyak ({filteredTransactions.length - displayCount} lagi)
              </Button>
            )}

            {/* End of list message */}
            {!hasMore && displayedTransactions.length > 10 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Semua transaksi telah ditampilkan
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

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
    </PullToRefresh>
  );
};

export default History;
