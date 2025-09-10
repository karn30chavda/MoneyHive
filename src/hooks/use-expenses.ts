'use client';

import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/db';
import type { Expense, Category, Settings, Reminder } from '@/types';
import { isPast, startOfToday } from 'date-fns';

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

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [expensesData, categoriesData, settingsData, rawRemindersData] = await Promise.all([
        db.getExpenses(),
        db.getCategories(),
        db.getSettings(),
        db.getReminders(),
      ]);

      // Auto-delete past reminders
      const today = startOfToday();
      const pastReminderIds = rawRemindersData
        .filter(r => isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate)))
        .map(r => r.id!);
      
      if (pastReminderIds.length > 0) {
        await db.deleteMultipleReminders(pastReminderIds);
        // Refetch reminders after deletion
        const finalRemindersData = await db.getReminders();
        setReminders(finalRemindersData);
      } else {
        setReminders(rawRemindersData);
      }

      setExpenses(expensesData.reverse());
      setCategories(categoriesData);
      setSettings(settingsData);

    } catch (error) {
      console.error('Failed to load or clean data from DB', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    events.addEventListener('db-updated', refreshData);
    return () => {
      events.removeEventListener('db-updated', refreshData);
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
