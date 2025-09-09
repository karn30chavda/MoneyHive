'use client';

import { useMemo, useState } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExpenseForm } from './ExpenseForm';
import type { Expense, Category } from '@/types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

export function ExpenseList() {
  const { expenses, categories, deleteExpense, loading } = useExpenses();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(expense => {
        const titleMatch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = categoryFilter === 'all' || expense.categoryId === Number(categoryFilter);
        return titleMatch && categoryMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [expenses, searchTerm, categoryFilter, sortOrder]);

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      toast({ title: 'Success', description: 'Expense deleted.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete expense.' });
    }
  };

  if (loading) {
    return <p>Loading expenses...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense History</CardTitle>
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{categoryMap.get(expense.categoryId) || 'Uncategorized'}</TableCell>
                    <TableCell>{format(new Date(expense.date), 'PP')}</TableCell>
                    <TableCell>{expense.paymentMode}</TableCell>
                    <TableCell className="text-right">
                       <Dialog open={editingExpense?.id === expense.id} onOpenChange={(isOpen) => !isOpen && setEditingExpense(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingExpense(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                          <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                          </DialogHeader>
                           <ExpenseForm expenseToEdit={editingExpense!} onFinished={() => setEditingExpense(null)} />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this expense.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(expense.id!)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No expenses found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
