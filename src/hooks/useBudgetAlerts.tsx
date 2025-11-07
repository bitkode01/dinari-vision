import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface BudgetAlert {
  category: string;
  percentage: number;
}

export const useBudgetAlerts = (categoryData: BudgetAlert[]) => {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    categoryData.forEach((cat) => {
      const key = `${cat.category}-${Math.floor(cat.percentage / 10) * 10}`;
      
      if (!notifiedRef.current.has(key)) {
        if (cat.percentage >= 100) {
          toast.error(`⚠️ Budget ${cat.category} terlampaui!`, {
            description: `${cat.percentage.toFixed(0)}% dari budget telah terpakai`,
            duration: 5000,
          });
          notifiedRef.current.add(key);
        } else if (cat.percentage >= 80) {
          toast.warning(`Budget ${cat.category} hampir habis`, {
            description: `${cat.percentage.toFixed(0)}% dari budget telah terpakai`,
            duration: 4000,
          });
          notifiedRef.current.add(key);
        }
      }
    });

    // Clean up old notifications if percentages drop
    const currentKeys = new Set(
      categoryData
        .filter(cat => cat.percentage >= 80)
        .map(cat => `${cat.category}-${Math.floor(cat.percentage / 10) * 10}`)
    );
    
    notifiedRef.current.forEach((key) => {
      if (!currentKeys.has(key)) {
        notifiedRef.current.delete(key);
      }
    });
  }, [categoryData]);
};
