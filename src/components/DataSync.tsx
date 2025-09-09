'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import type { Expense } from '@/types';

export function DataSync() {
  const { expenses, addExpense } = useExpenses();
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
      data = JSON.stringify(expenses, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      const header = ['id', 'title', 'amount', 'date', 'categoryId', 'paymentMode'];
      const rows = expenses.map(e => [e.id, e.title, e.amount, e.date, e.categoryId, e.paymentMode].join(','));
      data = [header.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerlite_expenses_${new Date().toISOString()}.${fileExtension}`;
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
        
        // Basic validation
        if (!Array.isArray(importedExpenses)) throw new Error('JSON is not an array');
        
        let importedCount = 0;
        for (const exp of importedExpenses) {
          if (exp.title && exp.amount && exp.date && exp.categoryId && exp.paymentMode) {
            await addExpense(exp);
            importedCount++;
          }
        }
        toast({ title: 'Import Successful', description: `${importedCount} expenses imported.` });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Import Failed', description: 'Invalid JSON file or format.' });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (event.target) event.target.value = '';
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Backup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Export Data</h4>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('json')}>
              <Download className="mr-2 h-4 w-4" /> Export as JSON
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Import Data</h4>
          <p className="text-sm text-muted-foreground mb-2">Import expenses from a JSON file.</p>
          <Button variant="outline" onClick={handleImportClick}>
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
