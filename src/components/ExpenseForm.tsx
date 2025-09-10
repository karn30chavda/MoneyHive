'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useExpenses } from '@/hooks/use-expenses';
import { useEffect, useState, useMemo } from 'react';
import type { Expense, PaymentMode } from '@/types';
import { CalendarIcon, PlusCircle, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({ required_error: 'Date is required' }),
  categoryId: z.coerce
    .number({
      invalid_type_error: 'Category is required',
      required_error: 'Category is required',
    })
    .min(1, 'Category is required'),
  paymentMode: z.enum(['Cash', 'UPI', 'Card', 'Other'], {
    required_error: 'Payment mode is required',
  }),
});

const paymentModes: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Other'];

export function ExpenseForm({
  expenseToEdit,
  onFinished,
}: {
  expenseToEdit?: Expense;
  onFinished?: () => void;
}) {
  const router = useRouter();
  const { categories, addExpense, updateExpense, addCategory } = useExpenses();
  const { toast } = useToast();
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const defaultCategoryId = useMemo(() => {
    if (categories.length === 0) return undefined;
    return categories.find(c => c.name === 'Miscellaneous')?.id ?? categories[0]?.id;
  }, [categories]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: expenseToEdit
      ? { ...expenseToEdit, date: new Date(expenseToEdit.date) }
      : {
          title: '',
          amount: undefined,
          date: new Date(),
          paymentMode: 'Other',
          categoryId: defaultCategoryId,
        },
  });

  useEffect(() => {
    if (expenseToEdit) {
      form.reset({
        ...expenseToEdit,
        date: new Date(expenseToEdit.date),
        amount: expenseToEdit.amount,
      });
    } else {
        if (defaultCategoryId && !form.getValues('categoryId')) {
            form.reset({
                title: '',
                amount: undefined,
                date: new Date(),
                paymentMode: 'Other',
                categoryId: defaultCategoryId
            });
        }
    }
  }, [expenseToEdit, form, defaultCategoryId, categories]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (expenseToEdit) {
        await updateExpense({
          ...values,
          id: expenseToEdit.id!,
          date: values.date.toISOString(),
        });
        toast({ title: 'Success', description: 'Expense updated successfully.' });
      } else {
        await addExpense({
          ...values,
          date: values.date.toISOString(),
        });
        toast({ title: 'Success', description: 'Expense added successfully.' });
      }
      if (onFinished) {
        onFinished();
      } else {
        router.push('/expenses');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save expense.',
      });
    }
  }

  const handleAddCategory = async () => {
    if (newCategory.trim() !== '') {
      try {
        const addedCategory = await addCategory({ name: newCategory.trim() });
        form.setValue('categoryId', addedCategory.id);
        setNewCategory('');
        setCategoryDialogOpen(false);
        toast({
          title: 'Success',
          description: `Category "${newCategory}" added.`,
        });
      } catch {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to add category.',
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? String(field.value) : undefined}
                    disabled={categories.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog
                    open={isCategoryDialogOpen}
                    onOpenChange={setCategoryDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input
                          placeholder="Category name"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button onClick={handleAddCategory}>Add Category</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a payment mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full md:w-auto">
          {expenseToEdit ? (
            <>
              <Pen className="mr-2 h-4 w-4" /> Update Expense
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function AddExpensePageClient() {
  const searchParams = useSearchParams();
  const expenseId = searchParams.get('id');
  const { getExpenseById, loading: expensesLoading } = useExpenses();
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (expenseId) {
      setLoading(true);
      getExpenseById(parseInt(expenseId, 10)).then((expense) => {
        if (expense) {
          setExpenseToEdit(expense);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [expenseId, getExpenseById]);

  if (loading || expensesLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
      </h1>
      <Card>
        <CardContent className="pt-6">
          <ExpenseForm expenseToEdit={expenseToEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
