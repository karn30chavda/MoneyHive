'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, IndianRupee, Bell, Calendar } from 'lucide-react';
import { format, differenceInDays, isFuture } from 'date-fns';
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
  
  const nextReminder = useMemo(() => {
    const futureReminders = reminders
      .map(r => ({...r, dueDateObj: new Date(r.dueDate)}))
      .filter(r => isFuture(r.dueDateObj) || differenceInDays(r.dueDateObj, new Date()) === 0)
      .sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime());
    
    return futureReminders.length > 0 ? futureReminders[0] : null;
  }, [reminders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Reminder</CardTitle>
      </CardHeader>
      <CardContent>
        {nextReminder ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                    <p className="font-medium">{nextReminder.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1"/> {formatCurrency(nextReminder.amount)}
                    </p>
                </div>
               <div className="text-right">
                    <p className="font-medium text-sm">{getDueDateMessage(new Date(nextReminder.dueDate))}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3"/>
                        {format(new Date(nextReminder.dueDate), 'PP')}
                    </p>
               </div>
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
