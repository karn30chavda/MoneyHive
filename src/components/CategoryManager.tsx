'use client';

import { useState } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function CategoryManager() {
  const { categories, addCategory, deleteCategory } = useExpenses();
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        await addCategory({ name: newCategory.trim() });
        setNewCategory('');
        toast({ title: 'Success', description: 'Category added.' });
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add category.' });
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      toast({ title: 'Success', description: 'Category deleted.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete category.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button onClick={handleAddCategory}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Your Categories</h4>
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-md border p-3">
                <span>{category.name}</span>
                {!category.isDefault && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Are you sure you want to delete this category?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
