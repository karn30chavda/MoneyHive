'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense, Category } from '@/types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
}

export function RecentExpenses({ expenses, categories }: RecentExpensesProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);
  
  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExpenses.length > 0 ? (
              recentExpenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell className="hidden sm:table-cell">{categoryMap.get(expense.categoryId) || 'Uncategorized'}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(new Date(expense.date), 'PP')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No recent expenses.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/expenses">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
