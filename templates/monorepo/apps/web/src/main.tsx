import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { App } from './App';
import { LandingPage } from './pages/LandingPage';
import { ChainProvider } from './providers/ChainProvider';
import { WalletProvider } from './providers/WalletProvider';
import { I18nProvider } from './i18n';
import { makeABetTheme } from './theme';
import './styles.css';

const queryClient = new QueryClient();

const RootComponent = () => <Outlet />;

const rootRoute = createRootRoute({ component: RootComponent });

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: App,
});

const routeTree = rootRoute.addChildren([landingRoute, appRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChainProvider>
        <WalletProvider>
          <MantineProvider theme={makeABetTheme} defaultColorScheme="dark">
            <Notifications position="top-right" />
            <I18nProvider>
              <RouterProvider router={router} />
            </I18nProvider>
          </MantineProvider>
        </WalletProvider>
      </ChainProvider>
    </QueryClientProvider>
  </StrictMode>
);
