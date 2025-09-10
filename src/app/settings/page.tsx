'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { CategoryManager } from '@/components/CategoryManager';
import { DataSync } from '@/components/DataSync';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

const settingsSchema = z.object({
  monthlyBudget: z.coerce.number().min(0, 'Budget must be a positive number.'),
});

function BudgetSettingsForm() {
  const { settings, saveSettings } = useExpenses();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      monthlyBudget: settings.monthlyBudget || 0,
    },
  });

  useEffect(() => {
    form.reset({ monthlyBudget: settings.monthlyBudget });
  }, [settings, form]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    try {
      await saveSettings({ ...settings, monthlyBudget: values.monthlyBudget });
      toast({ title: 'Success', description: 'Budget updated.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update budget.' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monthlyBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Set your monthly budget</FormLabel>
                  <FormControl>
                    <Input type="number" step="10" placeholder="e.g., 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Budget</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ClearDataCard() {
    const { expenses, clearExpenses, loading } = useExpenses();
    const { toast } = useToast();

    const handleClearExpenses = async () => {
        try {
        await clearExpenses();
        toast({ title: 'Success', description: 'All expense data has been deleted.' });
        } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear expenses.' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Clear Data</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete all of your expense data. This action cannot be undone.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={loading || expenses.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear All Expenses
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your expense data from your device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearExpenses}>Yes, delete everything</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-8">
            <BudgetSettingsForm />
            <DataSync />
            <ClearDataCard />
        </div>
        <div>
            <CategoryManager />
        </div>
      </div>
    </div>
  );
}
