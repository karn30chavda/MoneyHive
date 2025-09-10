'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as db from '@/lib/db';
import type { Expense, Category, Settings, Reminder } from '@/types';
import { isPast, isToday } from 'date-fns';

const events = new EventTarget();

export function notifyDbUpdate() {
  events.dispatchEvent(new Event('db-updated'));
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({ id: 1, monthlyBudget: 0 });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoadComplete = useRef(false);

  const refreshData = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad && !isInitialLoadComplete.current) {
        // If it's not the initial load but the initial load hasn't completed, do nothing.
        // This prevents re-fetching when navigating between pages before the first load is done.
        return;
    }
    setLoading(true);
    try {
      const [expensesData, categoriesData, settingsData, rawRemindersData] = await Promise.all([
        db.getExpenses(),
        db.getCategories(),
        db.getSettings(),
        db.getReminders(),
      ]);

      const today = new Date();
      today.setHours(0,0,0,0);
      const pastReminderIds = rawRemindersData
        .filter(r => {
            const dueDate = new Date(r.dueDate)
            dueDate.setHours(0,0,0,0)
            return isPast(dueDate) && !isToday(dueDate);
        })
        .map(r => r.id!);
      
      if (pastReminderIds.length > 0) {
        await db.deleteMultipleReminders(pastReminderIds);
        const finalRemindersData = await db.getReminders();
        setReminders(finalRemindersData);
      } else {
        setReminders(rawRemindersData);
      }

      setExpenses(expensesData.reverse());
      setCategories(categoriesData);
      setSettings(settingsData);
      
      if(isInitialLoad) {
        isInitialLoadComplete.current = true;
      }

    } catch (error) {
      console.error('Failed to load or clean data from DB', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData(true); // Mark this as the initial load
    
    const handleDbUpdate = () => refreshData(false); // Subsequent updates are not initial loads
    events.addEventListener('db-updated', handleDbUpdate);
    
    return () => {
      events.removeEventListener('db-updated', handleDbUpdate);
    };
  }, [refreshData]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    await db.addExpense(expense);
  }, []);

  const addMultipleExpenses = useCallback(async (newExpenses: Omit<Expense, 'id'>[]) => {
    for (const expense of newExpenses) {
        await db.addExpense(expense);
    }
  }, []);

  const updateExpense = useCallback(async (expense: Expense) => {
    await db.updateExpense(expense);
  }, []);

  const deleteExpense = useCallback(async (id: number) => {
    await db.deleteExpense(id);
  }, []);

  const deleteMultipleExpenses = useCallback(async (ids: number[]) => {
    await db.deleteMultipleExpenses(ids);
  }, []);

  const clearExpenses = useCallback(async () => {
    await db.clearExpenses();
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    await db.addCategory(category);
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    await db.deleteCategory(id);
  }, []);
  
  const saveSettings = useCallback(async (newSettings: Settings) => {
    await db.saveSettings(newSettings);
  }, []);

  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    await db.addReminder(reminder);
  }, []);

  const deleteReminder = useCallback(async (id: number) => {
    await db.deleteReminder(id);
  }, []);

  return {
    expenses,
    categories,
    settings,
    reminders,
    loading,
    addExpense,
    addMultipleExpenses,
    updateExpense,
    deleteExpense,
    deleteMultipleExpenses,
    getExpenseById: db.getExpenseById,
    clearExpenses,
    addCategory,
    deleteCategory,
    saveSettings,
    addReminder,
    deleteReminder,
  };
}
