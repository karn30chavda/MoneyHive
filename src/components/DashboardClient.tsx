'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetTracker } from '@/components/BudgetTracker';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentExpenses } from './RecentExpenses';

export function DashboardClient() {
  const { expenses, settings, categories, loading } = useExpenses();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <Skeleton className="h-[350px]" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[350px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <SummaryCards expenses={expenses} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
           <RecentExpenses expenses={expenses} categories={categories} />
        </div>
        <div className="lg:col-span-3">
          <BudgetTracker expenses={expenses} settings={settings} />
        </div>
      </div>
    </div>
  );
}
