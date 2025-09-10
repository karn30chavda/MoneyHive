'use client';

import { useMemo, useState } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, IndianRupee, Landmark, CreditCard, Wallet, Calendar, Tag, PlusCircle, ScanLine, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExpenseForm } from './ExpenseForm';
import type { Expense } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const PaymentModeIcon = ({ mode }: { mode: string }) => {
    switch (mode) {      
        case 'UPI': return <Landmark className="h-4 w-4" />;
        case 'Card': return <CreditCard className="h-4 w-4" />;
        case 'Cash': return <Wallet className="h-4 w-4" />;
        default: return <Wallet className="h-4 w-4" />;
    }
};

export function ExpenseList() {
  const { expenses, categories, deleteExpense, deleteMultipleExpenses, loading } = useExpenses();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);

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
        return sortOrder === 'newest' ? dateB - dateA : dateA - b.id!;
      });
  }, [expenses, searchTerm, categoryFilter, sortOrder]);
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if(checked) {
      setSelectedExpenses(filteredExpenses.map(e => e.id!));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      toast({ title: 'Success', description: 'Expense deleted.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete expense.' });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteMultipleExpenses(selectedExpenses);
      toast({ title: 'Success', description: `${selectedExpenses.length} expenses deleted.` });
      setSelectedExpenses([]);
    } catch {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete selected expenses.' });
    }
  };


  if (loading) {
    return <p>Loading expenses...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expense History</CardTitle>
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
        {selectedExpenses.length > 0 && (
          <div className="mt-4 flex justify-between items-center bg-muted/50 p-3 rounded-lg">
            <span className="text-sm font-medium">{selectedExpenses.length} expense(s) selected</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedExpenses.length} expense(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Yes, delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredExpenses.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            <div className="flex items-center gap-4 px-1 py-2 border-b">
                 <Checkbox 
                  id="select-all"
                  checked={selectedExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all expenses"
                />
                <label htmlFor='select-all' className='text-sm font-medium text-muted-foreground'>Select All</label>
            </div>
            {filteredExpenses.map(expense => (
              <AccordionItem value={`item-${expense.id}`} key={expense.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between w-full pr-4 items-center">
                    <div className='flex items-center gap-4'>
                      <Checkbox
                          id={`select-${expense.id}`}
                          checked={selectedExpenses.includes(expense.id!)}
                          onCheckedChange={(checked) => {
                            if(checked) {
                              setSelectedExpenses(prev => [...prev, expense.id!]);
                            } else {
                              setSelectedExpenses(prev => prev.filter(id => id !== expense.id!));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      <span className="font-medium">{expense.title}</span>
                    </div>
                    <span className="flex items-center font-semibold">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-2 space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4"/>
                            <span>{categoryMap.get(expense.categoryId) || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4"/>
                           <span>{format(new Date(expense.date), 'PP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <PaymentModeIcon mode={expense.paymentMode}/>
                           <span>{expense.paymentMode}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                       <Dialog open={editingExpense?.id === expense.id} onOpenChange={(isOpen) => !isOpen && setEditingExpense(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingExpense(expense)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
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
                           <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>No expenses found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
