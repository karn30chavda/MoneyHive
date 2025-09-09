# MoneyHive - Personal Expense Tracker PWA

MoneyHive is a modern, offline-first Progressive Web App (PWA) designed to help you manage your personal finances with ease. Track your expenses, set budgets, and stay on top of your spending habits, even without an internet connection.

## ✨ Key Features

*   **Expense Tracking:** Quickly add and categorize your daily expenses.
*   **Budget Management:** Set a monthly budget and track your progress in real-time.
*   **Visual Reports:** Interactive charts provide insights into your spending by category and over time.
*   **Expense Reminders:** Set reminders for upcoming bills and payments so you never miss one.
*   **PWA & Offline Support:** Install MoneyHive on your device and use it anytime, anywhere, with or without an internet connection. All data is stored locally on your device using IndexedDB.
*   **Data Export/Import:** Backup your expense data to a JSON or CSV file, and import it when needed.
*   **Dark Mode:** Switch between light and dark themes for your comfort.
*   **Responsive Design:** A clean and intuitive interface that works beautifully on desktop and mobile devices.

## 🚀 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/)
*   **Component Library:** [ShadCN/UI](https://ui.shadcn.com/)
*   **Charting:** [Recharts](https://recharts.org/)
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

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## 部署 (Deployment)

This application is configured for easy deployment on platforms like [Vercel](https://vercel.com/) or [Firebase App Hosting](https://firebase.google.com/docs/app-hosting). Simply connect your Git repository and the platform will handle the build and deployment process automatically.
