import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { Outlet, RouterProvider, createRootRoute, createRoute, createRouter, } from '@tanstack/react-router';
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
const RootComponent = () => _jsx(Outlet, {});
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
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(ChainProvider, { children: _jsx(WalletProvider, { children: _jsxs(MantineProvider, { theme: makeABetTheme, defaultColorScheme: "dark", children: [_jsx(Notifications, { position: "top-right" }), _jsx(I18nProvider, { children: _jsx(RouterProvider, { router: router }) })] }) }) }) }) }));
