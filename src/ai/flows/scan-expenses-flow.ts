'use server';
/**
 * @fileOverview An AI flow for scanning expense lists from an image.
 * 
 * - scanExpenses - A function that handles the expense scanning process.
 * - ScanExpensesInput - The input type for the scanExpenses function.
 * - ScanExpensesOutput - The return type for the scanExpenses function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ScanExpensesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a list of expenses, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanExpensesInput = z.infer<typeof ScanExpensesInputSchema>;

const ScannedExpenseSchema = z.object({
    title: z.string().describe('The name or description of the expense item.'),
    amount: z.number().describe('The cost of the expense item.'),
});
export type ScannedExpense = z.infer<typeof ScannedExpenseSchema>;

const ScanExpensesOutputSchema = z.object({
  expenses: z.array(ScannedExpenseSchema).describe('An array of expense objects found in the image.'),
});
export type ScanExpensesOutput = z.infer<typeof ScanExpensesOutputSchema>;


export async function scanExpenses(input: ScanExpensesInput): Promise<ScanExpensesOutput> {
  return scanExpensesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanExpensesPrompt',
  input: { schema: ScanExpensesInputSchema },
  output: { schema: ScanExpensesOutputSchema },
  prompt: `You are an expert at reading and parsing expense lists from images. The user has provided an image that contains a list of expenses. This could be a handwritten note, a screenshot, or a receipt.

Your task is to analyze the image and extract every expense item along with its corresponding amount.

- Identify each distinct item in the list.
- Extract the numerical amount for each item.
- Ignore any text that isn't an expense item (like titles, dates, or totals).
- If an item doesn't have a clear amount, skip it.
- Return the data as an array of structured expense objects.

Image with the expense list: {{media url=photoDataUri}}`,
});

const scanExpensesFlow = ai.defineFlow(
  {
    name: 'scanExpensesFlow',
    inputSchema: ScanExpensesInputSchema,
    outputSchema: ScanExpensesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
