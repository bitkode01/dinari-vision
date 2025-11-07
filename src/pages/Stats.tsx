import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Stats = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === "add") {
      setAddDialogOpen(true);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground">Statistik</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analisis keuangan Anda
        </p>
      </div>

      {/* Content */}
      <div className="px-6">
        <Card className="p-12 text-center">
          <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Statistik Segera Hadir!
          </h3>
          <p className="text-sm text-muted-foreground">
            Kami sedang mempersiapkan grafik dan analisis lengkap untuk Anda.
          </p>
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
