'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import type { Expense } from '@/types';
import { startOfToday, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';

interface SummaryCardsProps {
  expenses: Expense[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export function SummaryCards({ expenses }: SummaryCardsProps) {
  const { todayTotal, weekTotal, monthTotal } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfToday();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    expenses.forEach(expense => {
      const expenseDate = parseISO(expense.date);
      if (isAfter(expenseDate, todayStart)) {
        todayTotal += expense.amount;
      }
      if (isAfter(expenseDate, weekStart)) {
        weekTotal += expense.amount;
      }
      if (isAfter(expenseDate, monthStart)) {
        monthTotal += expense.amount;
      }
    });

    return { todayTotal, weekTotal, monthTotal };
  }, [expenses]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(todayTotal)}</div>
          <p className="text-xs text-muted-foreground">Total for today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week's Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(weekTotal)}</div>
          <p className="text-xs text-muted-foreground">Total for this week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthTotal)}</div>
          <p className="text-xs text-muted-foreground">Total for this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
