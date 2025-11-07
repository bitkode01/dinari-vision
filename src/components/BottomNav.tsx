import { Home, List, Plus, BarChart3, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: "home", icon: Home, label: "Home", path: "/" },
    { id: "history", icon: List, label: "Riwayat", path: "/history" },
    { id: "add", icon: Plus, label: "Tambah", path: null },
    { id: "stats", icon: BarChart3, label: "Statistik", path: "/stats" },
    { id: "settings", icon: Settings, label: "Pengaturan", path: "/settings" },
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.path) {
      navigate(tab.path);
    } else {
      onTabChange(tab.id);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path) {
      return location.pathname === tab.path;
    }
    return activeTab === tab.id;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {tabs.map((tab, index) => {
          const isCenter = index === 2;
          const active = isActive(tab);

          if (isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-button transition-all hover:scale-110 active:scale-95"
              >
                <tab.icon className="h-6 w-6 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
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
