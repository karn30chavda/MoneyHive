'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { scanExpenses } from '@/ai/flows/scan-expenses-flow';
import type { ScannedExpense } from '@/ai/flows/scan-expenses-flow';
import { useExpenses } from '@/hooks/use-expenses';
import { Loader2, Upload, Camera, PlusCircle, Trash2, CalendarIcon, IndianRupee, ImageUp, CircleX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Expense, PaymentMode } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


type EditableExpense = Omit<Expense, 'id'>;
const paymentModes: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Other'];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);
  
  const handleTabChange = (value: string) => {
      setIsCameraOn(value === 'camera');
  }

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
    if (!navigator.onLine) {
        toast({ variant: 'destructive', title: 'Offline', description: 'An internet connection is required to use the AI scanner.' });
        return;
    }
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
  
  const resetImage = () => {
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

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
          <CardContent className="space-y-6">
            <Tabs defaultValue="upload" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4"/> Upload File</TabsTrigger>
                    <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4"/> Use Camera</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                    <div className="mt-4 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center text-center h-64">
                         <ImageUp className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Click to upload or drag and drop</h3>
                        <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        <Button type="button" variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                           Browse Files
                        </Button>
                        <Input 
                            ref={fileInputRef} 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="camera">
                     <div className="mt-4 space-y-2 bg-muted rounded-md p-2">
                        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button onClick={handleCapture} className="w-full" disabled={!hasCameraPermission}>
                            <Camera className="mr-2 h-4 w-4"/> Capture Photo
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
            {imagePreview && (
                <div className="mt-4">
                    <h3 className="font-semibold mb-2">Image Preview:</h3>
                     <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Expense list preview" className="rounded-md max-h-64 w-auto mx-auto" />
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80" onClick={resetImage}>
                            <CircleX className="h-5 w-5" />
                        </Button>
                     </div>
                </div>
            )}
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
              <Accordion type="single" collapsible className="w-full space-y-2">
                {editableExpenses.map((expense, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border rounded-md px-4">
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span className="font-medium">{expense.title}</span>
                            <span className="flex items-center font-semibold">
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {formatCurrency(expense.amount)}
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${index}`}>Title</Label>
                                    <Input id={`title-${index}`} value={expense.title} onChange={(e) => handleExpenseChange(index, 'title', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`amount-${index}`}>Amount</Label>
                                    <Input id={`amount-${index}`} type="number" value={expense.amount} onChange={(e) => handleExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                     <Label htmlFor={`date-${index}`}>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id={`date-${index}`}
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
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`category-${index}`}>Category</Label>
                                    <Select value={String(expense.categoryId)} onValueChange={(value) => handleExpenseChange(index, 'categoryId', Number(value))}>
                                        <SelectTrigger id={`category-${index}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`payment-${index}`}>Payment Mode</Label>
                                    <Select value={expense.paymentMode} onValueChange={(value) => handleExpenseChange(index, 'paymentMode', value as PaymentMode)}>
                                        <SelectTrigger id={`payment-${index}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeExpense(index)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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

    