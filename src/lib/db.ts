'use client';
import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import type { Expense, Category, Settings, Reminder } from '@/types';
import { notifyDbUpdate } from '@/hooks/use-expenses';

const DB_NAME = 'MoneyHiveDB';
const DB_VERSION = 2; // Incremented version for schema change

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', isDefault: true },
  { name: 'Travel', isDefault: true },
  { name: 'Shopping', isDefault: true },
  { name: 'Bills', isDefault: true },
  { name: 'Entertainment', isDefault: true },
  { name: 'Health', isDefault: true },
  { name: 'Education', isDefault: true },
  { name: 'Miscellaneous', isDefault: true },
];

interface MoneyHiveDB extends DBSchema {
  expenses: {
    key: number;
    value: Expense;
    indexes: { 'date': string };
  };
  categories: {
    key: number;
    value: Category;
  };
  settings: {
    key: number;
    value: Settings;
  };
  reminders: {
    key: number;
    value: Reminder;
    indexes: { 'dueDate': string };
  };
}

let db: IDBPDatabase<MoneyHiveDB> | null = null;

async function getDb() {
  if (db) return db;

  db = await openDB<MoneyHiveDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        expenseStore.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        DEFAULT_CATEGORIES.forEach(category => categoryStore.add(category as Category));
      }
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
        settingsStore.add({ monthlyBudget: 0, id: 1 });
      }
      if (oldVersion < 2) { // Check if we need to add the reminders store
        if (!db.objectStoreNames.contains('reminders')) {
          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
          reminderStore.createIndex('dueDate', 'dueDate');
        }
      }
    },
  });

  const settings = await db.get('settings', 1);
  if (!settings) {
    await db.add('settings', { monthlyBudget: 0, id: 1 });
  }

  return db;
}

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  const db = await getDb();
  await db.add('expenses', expense as Expense);
  notifyDbUpdate();
};

export const getExpenses = async () => {
  const db = await getDb();
  return db.getAllFromIndex('expenses', 'date');
};

export const updateExpense = async (expense: Expense) => {
  const db = await getDb();
  await db.put('expenses', expense);
  notifyDbUpdate();
};

export const deleteExpense = async (id: number) => {
  const db = await getDb();
  await db.delete('expenses', id);
  notifyDbUpdate();
};

export const getExpenseById = async (id: number) => {
  const db = await getDb();
  return db.get('expenses', id);
};

// Categories
export const addCategory = async (category: Omit<Category, 'id'>) => {
  const db = await getDb();
  await db.add('categories', category as Category);
  notifyDbUpdate();
};

export const getCategories = async () => {
  const db = await getDb();
  return db.getAll('categories');
};

export const deleteCategory = async (id: number) => {
  const db = await getDb();
  await db.delete('categories', id);
  notifyDbUpdate();
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  const db = await getDb();
  const settings = await db.get('settings', 1);
  return settings || { id: 1, monthlyBudget: 0 };
};

export const saveSettings = async (settings: Settings) => {
  const db = await getDb();
  await db.put('settings', { ...settings, id: 1 });
  notifyDbUpdate();
};

// Reminders
export const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
  const db = await getDb();
  await db.add('reminders', reminder as Reminder);
  notifyDbUpdate();
};

export const getReminders = async (): Promise<Reminder[]> => {
  const db = await getDb();
  return db.getAllFromIndex('reminders', 'dueDate');
};

export const deleteReminder = async (id: number) => {
  const db = await getDb();
  await db.delete('reminders', id);
  notifyDbUpdate();
};
