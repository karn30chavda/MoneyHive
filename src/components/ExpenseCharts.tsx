'use client';

import { useMemo } from 'react';
import type { Expense, Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Cell } from 'recharts';
import { subDays, format, parseISO, startOfDay, getMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { IndianRupee } from 'lucide-react';

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

const formatCurrency = (amount: number | bigint) => {
    const numAmount = Number(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
};

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isDailyOrMonthlyChart = 'date' in data || 'month' in data;
      const tooltipLabel = isDailyOrMonthlyChart ? (data.date || data.month) : data.name;
      const tooltipValue = payload[0].value;

      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-sm">
          <p className="label font-medium">{tooltipLabel}</p>
          <p className="intro flex items-center">
            <IndianRupee className="h-4 w-4 mr-1" />
            {formatCurrency(tooltipValue)}
          </p>
        </div>
      );
    }
    return null;
  };

interface ExpenseChartsProps {
    expenses: Expense[];
    categories: Category[];
}

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
  
  const monthlySpending = useMemo(() => {
    const spending = new Array(12).fill(0).map((_, i) => ({ month: format(new Date(0, i), 'MMM'), amount: 0 }));
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    expenses.forEach(expense => {
        const expenseDate = parseISO(expense.date);
        if (isWithinInterval(expenseDate, { start: yearStart, end: yearEnd })) {
            const monthIndex = getMonth(expenseDate);
            spending[monthIndex].amount += expense.amount;
        }
    });

    return spending;
  }, [expenses]);

  const chartConfig = {
    amount: {
      label: 'Amount',
      icon: IndianRupee,
    },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 grid-cols-1">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<CustomTooltipContent />} />
                  <Pie data={categorySpending} dataKey="value" nameKey="name" innerRadius="30%" strokeWidth={2}>
                      {categorySpending.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Daily Spending (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart accessibilityLayer data={dailySpending} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => `${formatCurrency(value as number).split('.')[0]}`} width={60} />
                <ChartTooltip content={<CustomTooltipContent />} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
       <Card className="overflow-hidden md:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Spending (This Year)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart accessibilityLayer data={monthlySpending} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => `${formatCurrency(value as number).split('.')[0]}`} width={60} />
                <ChartTooltip content={<CustomTooltipContent />} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
