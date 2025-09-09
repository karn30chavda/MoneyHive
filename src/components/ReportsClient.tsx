'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportsClient() {
  const { expenses, categories, loading } = useExpenses();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="lg:col-span-3 h-[380px]" />
          <Skeleton className="lg:col-span-4 h-[380px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
      <ExpenseCharts expenses={expenses} categories={categories} />
    </div>
  );
}
