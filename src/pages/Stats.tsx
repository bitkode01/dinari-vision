import { useState, useMemo, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { BottomNav } from "@/components/BottomNav";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, PieChart as PieChartIcon, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, getMonth, getYear } from "date-fns";
import { id as localeId } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(219, 91%, 65%)",
  "hsl(268, 92%, 70%)",
  "hsl(145, 74%, 56%)",
  "hsl(0, 100%, 72%)",
];

const Stats = () => {
  const { transactions, isLoading } = useTransactions();
  const [activeTab, setActiveTab] = useState("stats");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  
  // Fetch budgets for selected month/year
  const { budgets } = useBudgets(parseInt(selectedMonth), parseInt(selectedYear));

  const handleTabChange = (tab: string) => {
    if (tab === "add") {
      setAddDialogOpen(true);
    }
    setActiveTab(tab);
  };

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set(
      transactions.map((t) => getYear(parseISO(t.date)))
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions by selected year and month
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = parseISO(t.date);
      const year = getYear(date);
      const month = getMonth(date) + 1;
      
      return year === parseInt(selectedYear) && month === parseInt(selectedMonth);
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Calculate category breakdown for pie chart (expenses only) with budget comparison
  const categoryData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter((t) => t.type === "expense");
    const categoryTotals: Record<string, number> = {};

    expenseTransactions.forEach((t) => {
      const category = t.category || "Lainnya";
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(t.amount);
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => {
        const budget = budgets.find((b) => b.category === name);
        return {
          name,
          value,
          percentage: 0,
          budget: budget ? Number(budget.amount) : null,
          budgetPercentage: budget ? (value / Number(budget.amount)) * 100 : null,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, budgets]);

  // Calculate total for percentages
  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);
  const categoryDataWithPercentage = categoryData.map((item) => ({
    ...item,
    percentage: totalExpense > 0 ? (item.value / totalExpense) * 100 : 0,
  }));

  // Calculate monthly trend for line chart (entire year)
  const monthlyTrendData = useMemo(() => {
    const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthTransactions = transactions.filter((t) => {
        const date = parseISO(t.date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const balance = income - expense;

      return {
        month: format(month, "MMM", { locale: localeId }),
        income,
        expense,
        balance,
      };
    });
  }, [transactions, selectedYear]);

  // Calculate income vs expense for bar chart (selected month)
  const incomeVsExpenseData = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return [
      { name: "Pemasukan", value: income, fill: "hsl(var(--success))" },
      { name: "Pengeluaran", value: expense, fill: "hsl(var(--destructive))" },
    ];
  }, [filteredTransactions]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Budget alert notifications (only for categories with budgets that are over 80%)
  const budgetAlerts = useMemo(() => {
    return categoryData
      .filter((cat) => cat.budgetPercentage !== null && cat.budgetPercentage >= 80)
      .map((cat) => ({
        category: cat.name,
        percentage: cat.budgetPercentage!,
      }));
  }, [categoryData]);

  useBudgetAlerts(budgetAlerts);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-3xl font-bold text-foreground">Statistik</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analisis keuangan Anda
          </p>

          {/* Filters */}
          <div className="mt-4 flex gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={new Date().getFullYear().toString()}>
                    {new Date().getFullYear()}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {format(new Date(2024, month - 1), "MMMM", { locale: localeId })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Budget Info Banner */}
        {budgets.length === 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Set Budget Anda
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Pantau pengeluaran dengan lebih baik dengan mengatur budget per kategori
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = "/settings"}
                >
                  Atur Budget
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Pemasukan</p>
            </div>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(summary.income).replace("IDR", "Rp")}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Pengeluaran</p>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(summary.expense).replace("IDR", "Rp")}
            </p>
          </Card>
        </div>

        {/* Income vs Expense Bar Chart */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pemasukan vs Pengeluaran
          </h3>
          {incomeVsExpenseData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) =>
                    formatCurrency(value).replace("IDR", "Rp")
                  }
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Belum ada data untuk bulan ini
            </div>
          )}
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pengeluaran per Kategori
          </h3>
          {categoryDataWithPercentage.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDataWithPercentage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) =>
                      `${name} (${percentage.toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDataWithPercentage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) =>
                      formatCurrency(value).replace("IDR", "Rp")
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryDataWithPercentage.map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(item.value).replace("IDR", "Rp")}
                      </span>
                    </div>
                    {item.budget && (
                      <div className="ml-5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Budget: {formatCurrency(item.budget).replace("IDR", "Rp")}
                          </span>
                          <span className={
                            item.budgetPercentage! >= 100
                              ? "text-destructive font-medium"
                              : item.budgetPercentage! >= 80
                              ? "text-yellow-500 font-medium"
                              : ""
                          }>
                            {item.budgetPercentage!.toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(item.budgetPercentage!, 100)}
                          className="h-2"
                          indicatorClassName={
                            item.budgetPercentage! >= 100
                              ? "bg-destructive"
                              : item.budgetPercentage! >= 80
                              ? "bg-yellow-500"
                              : "bg-success"
                          }
                        />
                        {item.budgetPercentage! >= 100 && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Budget terlampaui!</span>
                          </div>
                        )}
                        {item.budgetPercentage! >= 80 && item.budgetPercentage! < 100 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Mendekati limit budget</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <PieChartIcon className="h-12 w-12 mb-2" />
              <p>Belum ada pengeluaran di bulan ini</p>
            </div>
          )}
        </Card>

        {/* Monthly Trend Line Chart */}
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Tren Saldo Bulanan {selectedYear}
          </h3>
          {monthlyTrendData.some((d) => d.income > 0 || d.expense > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) =>
                    formatCurrency(value).replace("IDR", "Rp")
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Pemasukan"
                  dot={{ fill: "hsl(var(--success))" }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  name="Pengeluaran"
                  dot={{ fill: "hsl(var(--destructive))" }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Saldo"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Belum ada transaksi di tahun {selectedYear}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default Stats;
