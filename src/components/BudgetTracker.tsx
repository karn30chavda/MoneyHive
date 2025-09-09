'use client';

import { useMemo } from 'react';
import type { Expense, Settings } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { startOfMonth, isAfter, parseISO } from 'date-fns';

interface BudgetTrackerProps {
  expenses: Expense[];
  settings: Settings;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export function BudgetTracker({ expenses, settings }: BudgetTrackerProps) {
  const { monthlyBudget } = settings;

  const monthTotal = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    return expenses
      .filter(expense => isAfter(parseISO(expense.date), monthStart))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const remaining = monthlyBudget - monthTotal;
  const progress = monthlyBudget > 0 ? (monthTotal / monthlyBudget) * 100 : 0;
  const isExceeded = remaining < 0;

  if (monthlyBudget === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No budget set. Go to settings to add one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between font-medium">
            <span>{formatCurrency(monthTotal)}</span>
            <span className="text-muted-foreground">of {formatCurrency(monthlyBudget)}</span>
          </div>
          <Progress value={progress > 100 ? 100 : progress} className={isExceeded ? '[&>div]:bg-destructive' : ''}/>
          <p className={`text-sm ${isExceeded ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {isExceeded 
              ? `${formatCurrency(Math.abs(remaining))} over budget`
              : `${formatCurrency(remaining)} remaining`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
