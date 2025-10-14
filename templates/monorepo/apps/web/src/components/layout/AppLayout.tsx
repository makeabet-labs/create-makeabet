import { AppShell, type AppShellMainProps, type AppShellProps } from '@mantine/core';
import { type ReactNode } from 'react';

interface AppLayoutProps extends Omit<AppShellProps, 'children'> {
  children: ReactNode;
  headerSection?: ReactNode;
  mainProps?: AppShellMainProps;
}

export function AppLayout({ children, headerSection, mainProps, ...rest }: AppLayoutProps) {
  return (
    <AppShell padding="lg" header={{ height: 72 }} {...rest}>
      {headerSection ? <AppShell.Header>{headerSection}</AppShell.Header> : null}
      <AppShell.Main {...mainProps}>{children}</AppShell.Main>
    </AppShell>
  );
}
