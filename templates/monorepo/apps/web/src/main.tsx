import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Buffer } from 'buffer';

import { App } from './App';
import { WalletProvider } from './providers/WalletProvider';
import { ChainProvider } from './providers/ChainProvider';
import './styles.css';

const queryClient = new QueryClient();

if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChainProvider>
        <WalletProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletProvider>
      </ChainProvider>
    </QueryClientProvider>
  </StrictMode>
);
