'use client';

import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/db';
import type { Expense, Category, Settings } from '@/types';

const events = new EventTarget();

export function notifyDbUpdate() {
  events.dispatchEvent(new Event('db-updated'));
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({ id: 1, monthlyBudget: 0 });
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData, settingsData] = await Promise.all([
        db.getExpenses(),
        db.getCategories(),
        db.getSettings(),
      ]);
      // Reverse expenses to show newest first
      setExpenses(expensesData.reverse());
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load data from DB', error);
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

  const updateExpense = useCallback(async (expense: Expense) => {
    await db.updateExpense(expense);
  }, []);

  const deleteExpense = useCallback(async (id: number) => {
    await db.deleteExpense(id);
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

  return {
    expenses,
    categories,
    settings,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById: db.getExpenseById,
    addCategory,
    deleteCategory,
    saveSettings,
  };
}
