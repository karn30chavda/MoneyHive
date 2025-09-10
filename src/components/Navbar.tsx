'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Settings, Menu, BarChart, Loader2, Bell, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';
import { Logo } from './Logo';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: List },
  { href: '/scan', label: 'Scan', icon: ScanLine },
  { href: '/reports', label: 'Reports', icon: BarChart },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  useEffect(() => {
    if (loadingPath) {
      setLoadingPath(null);
    }
  }, [pathname, loadingPath]);

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      setLoadingPath(href);
    }
    setSheetOpen(false);
  };
  
  const navLinks = (isMobile = false) => (
    <nav className={cn(
      "items-center text-sm font-medium",
      isMobile ? "flex flex-col gap-4 mt-8" : "hidden md:flex md:flex-row md:gap-5"
    )}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isLoading = loadingPath === href;
        const isCurrent = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={(e) => {
              if (isCurrent) e.preventDefault();
              handleLinkClick(href);
            }}
            className={cn(
              'transition-colors hover:text-primary flex items-center gap-2',
              isCurrent && !isLoading ? 'text-primary' : 'text-muted-foreground',
              isLoading && 'pointer-events-none text-muted-foreground',
              isMobile && 'text-lg'
            )}
            aria-disabled={isLoading}
            tabIndex={isLoading ? -1 : undefined}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            {label}
          </Link>
        )
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
        <Logo className="h-6 w-6" />
        <span className="">MoneyHive</span>
      </Link>
      <div className="hidden md:flex md:flex-1 md:items-center md:justify-center">
        {navLinks()}
      </div>
      <div className="flex w-full items-center justify-end gap-4 md:w-auto md:ml-auto">
        <ThemeToggle />
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 text-primary" onClick={() => setSheetOpen(false)}>
                <Logo className="h-6 w-6" />
                <span>MoneyHive</span>
              </Link>
              {navLinks(true)}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
