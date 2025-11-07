import { Home, List, Plus, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "history", icon: List, label: "Riwayat" },
    { id: "add", icon: Plus, label: "Tambah" },
    { id: "stats", icon: BarChart3, label: "Statistik" },
    { id: "settings", icon: Settings, label: "Pengaturan" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {tabs.map((tab, index) => {
          const isCenter = index === 2;
          const isActive = activeTab === tab.id;

          if (isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-button transition-all hover:scale-110 active:scale-95"
              >
                <tab.icon className="h-6 w-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
