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
import { Loader2, Upload, Camera, IndianRupee, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export function ExpenseScanner() {
  const { addMultipleExpenses } = useExpenses();
  const router = useRouter();
  const { toast } = useToast();
  const [scannedExpenses, setScannedExpenses] = useState<ScannedExpense[]>([]);
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
    setScannedExpenses([]);
    try {
        const result = await scanExpenses({ photoDataUri: imagePreview });
        setScannedExpenses(result.expenses);
        if (result.expenses.length === 0) {
          toast({ title: 'No Expenses Found', description: 'The AI could not find any expenses in the image.' });
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
    if (scannedExpenses.length === 0) return;
    setIsLoading(true);
    try {
      await addMultipleExpenses(scannedExpenses);
      toast({ title: 'Success', description: `${scannedExpenses.length} expenses have been added.` });
      router.push('/expenses');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the scanned expenses.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Scan Expenses</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Provide an Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              
              {imagePreview && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Image Preview:</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Expense list preview" className="rounded-md max-h-64 w-auto" />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleScanImage} disabled={!imagePreview || isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 animate-spin" />}
              Scan Image
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Review and Save</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {isLoading && !scannedExpenses.length ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : scannedExpenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedExpenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell className="text-right flex items-center justify-end">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Scanned expenses will appear here.</p>
                </div>
            )}
          </CardContent>
          <CardFooter>
              <Button onClick={handleSaveExpenses} disabled={scannedExpenses.length === 0 || isLoading} className="w-full">
                <PlusCircle className="mr-2" />
                Add to My Expenses
              </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
