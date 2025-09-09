'use client';

import { useMemo } from 'react';
import type { Expense, Settings } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { startOfMonth, isAfter, parseISO } from 'date-fns';
import { IndianRupee } from 'lucide-react';

interface BudgetTrackerProps {
  expenses: Expense[];
  settings: Settings;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
          <div className="flex justify-between font-medium items-center">
            <span className="flex items-center"><IndianRupee className="h-4 w-4 mr-1" />{formatCurrency(monthTotal)}</span>
            <span className="text-muted-foreground flex items-center">of <IndianRupee className="h-4 w-4 mx-1" />{formatCurrency(monthlyBudget)}</span>
          </div>
          <Progress value={progress > 100 ? 100 : progress} className={isExceeded ? '[&>div]:bg-destructive' : ''}/>
          <p className={`text-sm ${isExceeded ? 'text-destructive font-medium' : 'text-muted-foreground'} flex items-center`}>
            {isExceeded 
              ? <><IndianRupee className="h-3 w-3 mr-1" />{`${formatCurrency(Math.abs(remaining))} over budget`}</>
              : <><IndianRupee className="h-3 w-3 mr-1" />{`${formatCurrency(remaining)} remaining`}</>
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
