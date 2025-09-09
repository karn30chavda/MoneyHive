'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from './ui/carousel';
import Image from 'next/image';
import { ArrowRight, Wallet, BarChart, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const walkthroughSteps = [
  {
    icon: Wallet,
    title: "Track Your Expenses",
    description: "Quickly add expenses and categorize them to see where your money is going. It's simple and fast.",
    image: "https://picsum.photos/800/600",
    imageHint: "money expense"
  },
  {
    icon: BarChart,
    title: "Visualize Your Spending",
    description: "Interactive charts and reports give you a clear overview of your financial habits at a glance.",
    image: "https://picsum.photos/800/600",
    imageHint: "charts graphs"
  },
  {
    icon: Bell,
    title: "Never Miss a Bill",
    description: "Set reminders for upcoming bills and payments. We'll notify you a day before, so you're always on time.",
    image: "https://picsum.photos/800/600",
    imageHint: "reminder notification"
  },
  {
    icon: Settings,
    title: "Works Fully Offline",
    description: "MoneyHive is a PWA. All your data is stored on your device, so you can track expenses anywhere, anytime.",
    image: "https://picsum.photos/800/600",
    imageHint: "offline mobile"
  }
];

export function AppWalkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const hasVisited = localStorage.getItem('moneyhive_has_visited');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  
  const handleComplete = () => {
    localStorage.setItem('moneyhive_has_visited', 'true');
    setIsOpen(false);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="sm:max-w-md p-0">
        <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
                {walkthroughSteps.map((step, index) => (
                    <CarouselItem key={index}>
                        <div className="flex flex-col">
                            <div className="relative h-48 w-full">
                                <Image src={step.image} alt={step.title} fill style={{ objectFit: 'cover' }} data-ai-hint={step.imageHint}/>
                            </div>
                            <div className="p-6 space-y-3 text-center">
                                <div className="flex justify-center">
                                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <DialogHeader>
                                    <DialogTitle className="text-xl">{step.title}</DialogTitle>
                                    <DialogDescription>{step.description}</DialogDescription>
                                </DialogHeader>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4"/>
            <CarouselNext className="right-4"/>
        </Carousel>
        <DialogFooter className="p-6 pt-0 flex-row justify-between items-center">
            <div className="flex gap-2">
                {walkthroughSteps.map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => api?.scrollTo(index)}
                        className={cn("h-2 w-2 rounded-full", current === index + 1 ? 'bg-primary' : 'bg-muted-foreground/50')}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
            {current === walkthroughSteps.length ? (
                <Button onClick={handleComplete}>
                    Get Started
                </Button>
            ) : (
                <Button onClick={() => api?.scrollNext()} variant="ghost">
                    Next <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
