'use client';

import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/db';
import type { Expense, Category, Settings, Reminder } from '@/types';
import { isPast, isToday, startOfDay } from 'date-fns';

const events = new EventTarget();

// A custom event to notify all components using the hook that DB has changed.
export function notifyDbUpdate() {
  events.dispatchEvent(new Event('db-updated'));
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({ id: 1, monthlyBudget: 0 });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified function to fetch all data and update state
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [expensesData, categoriesData, settingsData, rawRemindersData] = await Promise.all([
        db.getExpenses(),
        db.getCategories(),
        db.getSettings(),
        db.getReminders(),
      ]);

      // --- Clean up past reminders ---
      const today = startOfDay(new Date());
      const pastReminderIds = rawRemindersData
        .filter(r => {
            const dueDate = startOfDay(new Date(r.dueDate));
            return isPast(dueDate) && !isToday(dueDate);
        })
        .map(r => r.id!);
      
      let finalRemindersData = rawRemindersData;
      if (pastReminderIds.length > 0) {
        await db.deleteMultipleReminders(pastReminderIds);
        // Re-fetch reminders after deletion
        finalRemindersData = await db.getReminders();
      }

      // Update state with fresh data
      // Reverse expenses to show newest first
      setExpenses(expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCategories(categoriesData);
      setSettings(settingsData);
      setReminders(finalRemindersData);

    } catch (error) {
      console.error('Failed to load or clean data from DB', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to load data on initial mount and listen for updates
  useEffect(() => {
    refreshData(); // Initial data load

    const handleDbUpdate = () => refreshData();
    events.addEventListener('db-updated', handleDbUpdate);
    
    // Cleanup listener on unmount
    return () => {
      events.removeEventListener('db-updated', handleDbUpdate);
    };
  }, [refreshData]);

  // --- Mutating Functions ---
  // Each function that changes the DB calls notifyDbUpdate() to trigger a refresh.

  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    await db.addExpense(expense);
    notifyDbUpdate();
  }, []);

  const addMultipleExpenses = useCallback(async (newExpenses: Omit<Expense, 'id'>[]) => {
    await db.addMultipleExpenses(newExpenses);
    notifyDbUpdate();
  }, []);

  const updateExpense = useCallback(async (expense: Expense) => {
    await db.updateExpense(expense);
    notifyDbUpdate();
  }, []);

  const deleteExpense = useCallback(async (id: number) => {
    await db.deleteExpense(id);
    notifyDbUpdate();
  }, []);

  const deleteMultipleExpenses = useCallback(async (ids: number[]) => {
    await db.deleteMultipleExpenses(ids);
    notifyDbUpdate();
  }, []);

  const clearExpenses = useCallback(async () => {
    await db.clearExpenses();
    notifyDbUpdate();
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>): Promise<Category> => {
    const newId = await db.addCategory(category);
    notifyDbUpdate();
    return { ...category, id: newId };
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    await db.deleteCategory(id);
    notifyDbUpdate();
  }, []);
  
  const saveSettings = useCallback(async (newSettings: Settings) => {
    await db.saveSettings(newSettings);
    notifyDbUpdate();
  }, []);

  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    await db.addReminder(reminder);
    notifyDbUpdate();
  }, []);

  const deleteReminder = useCallback(async (id: number) => {
    await db.deleteReminder(id);
    notifyDbUpdate();
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
