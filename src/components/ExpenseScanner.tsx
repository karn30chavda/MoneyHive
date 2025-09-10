'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { scanExpenses } from '@/ai/flows/scan-expenses-flow';
import type { ScannedExpense } from '@/ai/flows/scan-expenses-flow';
import { useExpenses } from '@/hooks/use-expenses';
import { Loader2, Upload, Camera, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Expense, PaymentMode } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type EditableExpense = Omit<Expense, 'id'>;
const paymentModes: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Other'];


export function ExpenseScanner() {
  const { addMultipleExpenses, categories } = useExpenses();
  const router = useRouter();
  const { toast } = useToast();
  const [editableExpenses, setEditableExpenses] = useState<EditableExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    const getCameraPermission = async () => {
      if (isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setIsCameraOn(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      } else {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
      }
    };
    getCameraPermission();
  }, [isCameraOn, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleScanImage = async () => {
    if (!imagePreview) {
        toast({ variant: 'destructive', title: 'No Image', description: 'Please select an image to scan.' });
        return;
    }
    setIsLoading(true);
    setEditableExpenses([]);
    try {
        const result = await scanExpenses({ photoDataUri: imagePreview });
        if (result.expenses.length === 0) {
          toast({ title: 'No Expenses Found', description: 'The AI could not find any expenses in the image.' });
        } else {
            const uncategorized = categories.find(c => c.name === 'Miscellaneous');
            const newEditableExpenses: EditableExpense[] = result.expenses.map(exp => ({
                title: exp.title,
                amount: exp.amount,
                date: new Date().toISOString(),
                categoryId: uncategorized?.id || 1,
                paymentMode: 'Other',
            }));
            setEditableExpenses(newEditableExpenses);
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Scan Failed', description: 'Could not process the image.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        setImagePreview(dataUri);
        setIsCameraOn(false); // Turn off camera after capture
      }
    }
  };

  const handleSaveExpenses = async () => {
    if (editableExpenses.length === 0) return;
    setIsLoading(true);
    try {
      await addMultipleExpenses(editableExpenses);
      toast({ title: 'Success', description: `${editableExpenses.length} expenses have been added.` });
      router.push('/expenses');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the scanned expenses.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpenseChange = <K extends keyof EditableExpense>(index: number, field: K, value: EditableExpense[K]) => {
      const newExpenses = [...editableExpenses];
      newExpenses[index][field] = value;
      setEditableExpenses(newExpenses);
  };

  const removeExpense = (index: number) => {
      setEditableExpenses(editableExpenses.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Scan Expenses</h1>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>1. Provide an Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-start">
              <div className="flex-1 min-w-[200px] space-y-4">
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                    <Upload className="mr-2" /> Upload Image
                  </Button>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button onClick={() => setIsCameraOn(prev => !prev)} variant="outline" className="w-full">
                    <Camera className="mr-2" /> {isCameraOn ? 'Close Camera' : 'Open Camera'}
                  </Button>
              </div>
              <div className="flex-1 min-w-[200px]">
                {isCameraOn && (
                    <div className="space-y-2">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button onClick={handleCapture} className="w-full" disabled={!hasCameraPermission}>Capture Photo</Button>
                    </div>
                )}
                {imagePreview && !isCameraOn && (
                    <div className="mt-4 md:mt-0">
                    <h3 className="font-semibold mb-2">Image Preview:</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Expense list preview" className="rounded-md max-h-64 w-auto" />
                    </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleScanImage} disabled={!imagePreview || isLoading} className="w-full">
              {isLoading && !editableExpenses.length ? <Loader2 className="mr-2 animate-spin" /> : null}
              Scan Image
            </Button>
          </CardFooter>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>2. Review and Save</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isLoading && !editableExpenses.length ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : editableExpenses.length > 0 ? (
                <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Title</TableHead>
                    <TableHead className="min-w-[100px]">Amount</TableHead>
                    <TableHead className="min-w-[200px]">Date</TableHead>
                    <TableHead className="min-w-[150px]">Category</TableHead>
                    <TableHead className="min-w-[150px]">Payment Mode</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableExpenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell><Input value={expense.title} onChange={(e) => handleExpenseChange(index, 'title', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" value={expense.amount} onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)} /></TableCell>
                      <TableCell>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn('w-full justify-start text-left font-normal',!expense.date && 'text-muted-foreground')}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expense.date ? format(new Date(expense.date), 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={new Date(expense.date)}
                                    onSelect={(date) => handleExpenseChange(index, 'date', date?.toISOString() || '')}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Select value={String(expense.categoryId)} onValueChange={(value) => handleExpenseChange(index, 'categoryId', Number(value))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </TableCell>
                       <TableCell>
                        <Select value={expense.paymentMode} onValueChange={(value) => handleExpenseChange(index, 'paymentMode', value as PaymentMode)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeExpense(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Scanned expenses will appear here.</p>
                </div>
            )}
          </CardContent>
          <CardFooter>
              <Button onClick={handleSaveExpenses} disabled={editableExpenses.length === 0 || isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                <PlusCircle className="mr-2" />
                Add to My Expenses
              </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
