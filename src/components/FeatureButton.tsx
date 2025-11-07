import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: "blue" | "purple";
  onClick?: () => void;
}

export const FeatureButton = ({
  title,
  description,
  icon: Icon,
  gradient,
  onClick,
}: FeatureButtonProps) => {
  const gradientClass = gradient === "purple" ? "bg-gradient-purple" : "bg-gradient-blue";
  const shadowClass = gradient === "purple" ? "shadow-feature" : "shadow-button";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl p-3.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
        gradientClass,
        shadowClass
      )}
    >
      <div className="relative z-10 flex items-start gap-2.5">
        <div className="rounded-lg bg-foreground/10 p-2">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-foreground/70">{description}</p>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-foreground/5 transition-transform group-hover:scale-110" />
    </button>
  );
};
