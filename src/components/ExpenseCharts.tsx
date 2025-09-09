'use client';

import { useMemo } from 'react';
import type { Expense, Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Cell } from 'recharts';
import { subDays, format, parseISO, startOfDay } from 'date-fns';

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: Category[];
}

const COLORS = ['#228B22', '#3CB371', '#8FBC8F', '#98FB98', '#90EE90', '#32CD32', '#008000', '#6B8E23'];

export function ExpenseCharts({ expenses, categories }: ExpenseChartsProps) {
  const categorySpending = useMemo(() => {
    const categoryMap = new Map<number, string>();
    categories.forEach(c => categoryMap.set(c.id, c.name));

    const spending = new Map<string, number>();
    expenses.forEach(expense => {
      const categoryName = categoryMap.get(expense.categoryId) || 'Uncategorized';
      spending.set(categoryName, (spending.get(categoryName) || 0) + expense.amount);
    });

    return Array.from(spending.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses, categories]);

  const dailySpending = useMemo(() => {
    const spending = new Map<string, number>();
    const today = startOfDay(new Date());

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayString = format(day, 'yyyy-MM-dd');
      spending.set(dayString, 0);
    }
    
    expenses.forEach(expense => {
        const expenseDay = format(parseISO(expense.date), 'yyyy-MM-dd');
        if (spending.has(expenseDay)) {
            spending.set(expenseDay, (spending.get(expenseDay) || 0) + expense.amount);
        }
    });
    
    return Array.from(spending.entries())
      .map(([date, amount]) => ({
        date: format(parseISO(date), 'EEE'),
        amount,
      }));
  }, [expenses]);
  
  const chartConfig = {
    amount: {
      label: 'Amount',
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <Pie data={categorySpending} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                {categorySpending.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Daily Spending (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={dailySpending} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-primary)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
