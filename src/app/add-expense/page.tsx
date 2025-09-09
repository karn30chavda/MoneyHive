'use client';
import AddExpensePageClient from '@/components/ExpenseForm';
import { Suspense } from 'react';

function AddExpensePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddExpensePageClient />
        </Suspense>
    );
}

export default AddExpensePage;
