'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, IndianRupee, Bell, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Reminder } from '@/types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

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

interface UpcomingRemindersProps {
  reminders: Reminder[];
}

export function UpcomingReminders({ reminders }: UpcomingRemindersProps) {
  
  const upcomingReminders = useMemo(() => {
    return reminders.slice(0, 3);
  }, [reminders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingReminders.length > 0 ? (
            <div className="space-y-4">
                {upcomingReminders.map(reminder => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                                <IndianRupee className="h-4 w-4 mr-1"/> {formatCurrency(reminder.amount)}
                            </p>
                        </div>
                       <div className="text-right">
                            <p className="font-medium text-sm">{getDueDateMessage(new Date(reminder.dueDate))}</p>
                            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                <Calendar className="h-3 w-3"/>
                                {format(new Date(reminder.dueDate), 'PP')}
                            </p>
                       </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-6 text-muted-foreground">
                <Bell className="mx-auto h-10 w-10" />
                <p className="mt-3">No upcoming reminders.</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/reminders">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
