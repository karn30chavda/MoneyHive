# MoneyHive - AI-Powered Personal Expense Tracker PWA

MoneyHive is a modern, offline-first Progressive Web App (PWA) designed to help you manage your personal finances with ease. Track your expenses, set budgets, and even scan receipts using AI, all while working seamlessly without an internet connection.

## ✨ Key Features

*   **Expense Tracking:** Quickly add and categorize your daily expenses.
*   **AI-Powered Expense Scanning:** Use your camera to scan a receipt or a list, and let AI automatically extract the expenses for you.
*   **Budget Management:** Set a monthly budget and track your progress in real-time.
*   **Expense Reminders:** Set reminders for upcoming bills and payments so you never miss one.
*   **PWA & Offline Support:** Install MoneyHive on your device and use it anytime, anywhere. All data is stored locally on your device using IndexedDB, making most features available offline.
*   **Data Export/Import:** Backup your expense data to a JSON or PDF file, and import it when needed.
*   **Dark Mode:** Switch between light and dark themes for your comfort.
*   **Responsive Design:** A clean and intuitive interface that works beautifully on desktop and mobile devices.

## 🚀 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **AI:** [Google's Gemini model via Genkit](https://firebase.google.com/docs/genkit)
*   **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/)
*   **Component Library:** [ShadCN/UI](https://ui.shadcn.com/)
*   **Local Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb` library)
*   **PWA:** Standard Web APIs (Service Worker, Manifest File)

## 🛠️ Getting Started

To run this project locally, you'll need [Node.js](https://nodejs.org/en) installed.

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add your Google AI API key:
    ```
    GEMINI_API_KEY=<your_api_key>
    ```
    You can get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.


## 🚀 Deployment

This application is configured for easy deployment on platforms like [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).

### Environment Variable

Before deploying, you **must** set the `GEMINI_API_KEY` environment variable in your deployment provider's settings. The AI expense scanner will not work without it.

### Build Settings

*   **Build command:** `npm run build`
*   **Publish directory:** `.next`

Your platform should automatically detect these settings for a Next.js project.
