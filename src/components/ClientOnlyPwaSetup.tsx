'use client';

import dynamic from 'next/dynamic';

// Dynamically import PwaSetup only on the client side
export const ClientOnlyPwaSetup = dynamic(() => 
    import('@/components/PwaSetup').then(mod => mod.PwaSetup), 
    { ssr: false }
);
