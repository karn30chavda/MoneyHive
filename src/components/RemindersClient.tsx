'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, CalendarIcon, IndianRupee, Bell } from 'lucide-react';
import { format, isToday, isFuture, differenceInDays, startOfTomorrow, isSameDay, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Reminder } from '@/types';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  dueDate: z.date({ required_error: 'Due date is required' }),
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// --- Service Worker and Notification Logic ---

// Function to register the periodic background sync
async function registerPeriodicSync() {
  if ('serviceWorker' in navigator && 'PeriodicSyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await (registration.periodicSync as any).register('check-reminders', {
        minInterval: 12 * 60 * 60 * 1000, // 12 hours
      });
    } catch (error) {
      console.error('Periodic sync registration failed:', error);
    }
  }
}

// Function to trigger notifications for due reminders
async function checkAndNotifyReminders(reminders: Reminder[]) {
    if (Notification.permission !== 'granted' || !navigator.serviceWorker) return;

    const registration = await navigator.serviceWorker.ready;
    
    reminders.forEach(reminder => {
      const dueDate = new Date(reminder.dueDate);
      let notificationBody: string | null = null;

      if (isToday(dueDate)) {
        notificationBody = `${reminder.title} for ${formatCurrency(reminder.amount)} is due today.`;
      } else if (isTomorrow(dueDate)) {
        notificationBody = `${reminder.title} for ${formatCurrency(reminder.amount)} is due tomorrow.`;
      }

      if (notificationBody) {
        registration.showNotification('Upcoming Expense Reminder', {
          body: notificationBody,
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: `reminder-${reminder.id}`,
          data: { url: '/reminders' },
        });
      }
    });
}


export function RemindersClient() {
  const { reminders, addReminder, deleteReminder, loading } = useExpenses();
  const { toast } = useToast();
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // --- Effects ---

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Effect to check reminders on component mount
  useEffect(() => {
    if (!loading && reminders.length > 0) {
      checkAndNotifyReminders(reminders);
    }
  }, [reminders, loading]);

  // --- Handlers ---

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'Notifications are not supported in this browser.' });
        return;
    };
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast({ title: "Permissions Granted", description: "You will now receive reminders." });
      registerPeriodicSync();
      checkAndNotifyReminders(reminders); // Check immediately after permission is granted
    } else {
      toast({ variant: 'destructive', title: "Permissions Denied", description: "You won't receive notifications for upcoming expenses." });
    }
  };

  const form = useForm<z.infer<typeof reminderSchema>>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      dueDate: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof reminderSchema>) {
    try {
      const newReminder = { ...values, dueDate: values.dueDate.toISOString() };
      await addReminder(newReminder);
      toast({ title: 'Success', description: 'Reminder added.' });
      
      // Check if this new reminder should trigger an immediate notification
      await checkAndNotifyReminders([newReminder as Reminder]);

      form.reset({
        title: '',
        amount: undefined,
        dueDate: new Date(),
      });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add reminder.' });
    }
  }
  
  async function handleDelete(id: number) {
      try {
          await deleteReminder(id);
          toast({ title: 'Success', description: 'Reminder deleted.'})
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete reminder.' });
      }
  }

  const getDueDateMessage = (dueDate: Date) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const reminderDate = new Date(dueDate);
      reminderDate.setHours(0,0,0,0);
      
      const days = differenceInDays(reminderDate, today);

      if (days < 0) return `Overdue by ${Math.abs(days)} day(s)`;
      if (days === 0) return 'Due today';
      if (days === 1) return 'Due tomorrow';
      return `Due in ${days} days`;
  };

  // --- JSX ---

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Bell/> Expense Reminders</h1>
        {notificationPermission === 'default' && (
             <Button onClick={requestNotificationPermission}>Enable Notifications</Button>
        )}
      </div>

      {notificationPermission === 'denied' && (
        <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertTitle>Notifications Disabled</AlertTitle>
            <AlertDescription>
                You have blocked notifications. To receive reminders, please enable them in your browser settings.
            </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add a New Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Rent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={(date) => {
                                if (date) field.onChange(date);
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
                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add Reminder</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {reminders.length > 0 ? (
                <div className="space-y-4">
                    {reminders.map(reminder => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <p className="font-medium">{reminder.title}</p>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <IndianRupee className="h-4 w-4 mr-1"/> {formatCurrency(reminder.amount)}
                                </p>
                            </div>
                           <div className="text-right">
                                <p className="font-medium text-sm">{getDueDateMessage(new Date(reminder.dueDate))}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(reminder.dueDate), 'PP')}</p>
                           </div>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete "{reminder.title}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. Are you sure you want to delete this reminder?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(reminder.id!)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12" />
                    <p className="mt-4">No upcoming reminders.</p>
                    <p className="text-sm">Add one to get notified!</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
