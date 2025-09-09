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

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-8">
            <BudgetSettingsForm />
            <DataSync />
        </div>
        <div>
            <CategoryManager />
        </div>
      </div>
    </div>
  );
}
