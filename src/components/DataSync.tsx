'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import type { Expense } from '@/types';
import * as db from '@/lib/db';

export function DataSync() {
  const { expenses, addExpense, loading } = useExpenses();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: 'json' | 'csv') => {
    if (expenses.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'There is no expense data to export.' });
      return;
    }

    let data;
    let mimeType;
    let fileExtension;

    if (format === 'json') {
      const exportableExpenses = expenses.map(({ id, ...rest }) => rest);
      data = JSON.stringify(exportableExpenses, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      const header = ['title', 'amount', 'date', 'categoryId', 'paymentMode'];
      const rows = expenses.map(e => [e.title, e.amount, e.date, e.categoryId, e.paymentMode].join(','));
      data = [header.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyhive_expenses_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: `Data exported as ${format.toUpperCase()}.` });
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error('Invalid file content');
        
        const importedExpenses: Omit<Expense, 'id'>[] = JSON.parse(content);
        
        if (!Array.isArray(importedExpenses)) throw new Error('JSON is not an array of expenses');
        
        await db.clearExpenses();

        let importedCount = 0;
        for (const exp of importedExpenses) {
          if (exp.title && exp.amount && exp.date && exp.categoryId && exp.paymentMode) {
            await addExpense(exp);
            importedCount++;
          }
        }
        toast({ title: 'Import Successful', description: `${importedCount} expenses were restored from your backup.` });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Import Failed', description: 'Invalid JSON file format. Please use a valid backup file.' });
      } finally {
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Backup & Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Export Data</h4>
          <p className="text-sm text-muted-foreground mb-2">Save a backup of all your expense data.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('json')} disabled={loading || expenses.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export as JSON
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')} disabled={loading || expenses.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Import Data</h4>
          <p className="text-sm text-muted-foreground mb-2">Restore expenses from a JSON backup file. This will overwrite all current expense data.</p>
          <Button variant="outline" onClick={handleImportClick} disabled={loading}>
            <Upload className="mr-2 h-4 w-4" /> Import from JSON
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/json"
            onChange={handleFileChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
