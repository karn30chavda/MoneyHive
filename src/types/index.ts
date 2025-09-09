export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Other';

export interface Category {
  id: number;
  name: string;
  isDefault?: boolean;
}

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  date: string; // ISO string
  categoryId: number;
  paymentMode: PaymentMode;
}

export interface Settings {
  id?: number;
  monthlyBudget: number;
}
