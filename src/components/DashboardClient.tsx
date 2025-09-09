'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetTracker } from '@/components/BudgetTracker';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardClient() {
  const { expenses, settings, loading } = useExpenses();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-[150px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryCards expenses={expenses} />
      <div className="grid gap-4">
        <BudgetTracker expenses={expenses} settings={settings} />
      </div>
    </div>
  );
}
