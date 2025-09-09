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

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <ChartContainer config={chartConfig} className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel formatter={(value) => formatCurrency(value as number)} />} />
                <Pie data={categorySpending} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    if (percent < 0.05) return null; // Don't render label for small slices
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                        {`${(percent * 100).toFixed(0)}%`}
                        </text>
                    );
                    }}
                >
                    {categorySpending.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart accessibilityLayer data={dailySpending} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => formatCurrency(value as number)} width={80} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
