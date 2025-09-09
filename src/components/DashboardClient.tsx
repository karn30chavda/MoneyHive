'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetTracker } from '@/components/BudgetTracker';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardClient() {
  const { expenses, categories, settings, loading } = useExpenses();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="lg:col-span-3 h-[380px]" />
          <Skeleton className="lg:col-span-4 h-[380px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryCards expenses={expenses} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-7">
             <BudgetTracker expenses={expenses} settings={settings} />
        </div>
      </div>
      <ExpenseCharts expenses={expenses} categories={categories} />
    </div>
  );
}
