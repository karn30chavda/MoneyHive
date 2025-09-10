'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetTracker } from '@/components/BudgetTracker';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentExpenses } from './RecentExpenses';
import Link from 'next/link';
import { Button } from './ui/button';
import { PlusCircle, ScanLine, ChevronDown } from 'lucide-react';
import { UpcomingReminders } from './UpcomingReminders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export function DashboardClient() {
  const { expenses, settings, categories, reminders, loading } = useExpenses();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-[350px]" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
            <DropdownMenu>
              <div className="flex items-center rounded-md border border-input">
                <Link href="/add-expense" passHref>
                  <Button variant="ghost" className="rounded-r-none border-r">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Expense
                  </Button>
                </Link>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                   <Link href="/scan" className="cursor-pointer">
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan Expenses
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <SummaryCards expenses={expenses} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
           <RecentExpenses expenses={expenses} categories={categories} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <BudgetTracker expenses={expenses} settings={settings} />
          <UpcomingReminders reminders={reminders} />
        </div>
      </div>
    </div>
  );
}
