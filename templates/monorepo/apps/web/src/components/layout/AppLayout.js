import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppShell } from '@mantine/core';
export function AppLayout({ children, headerSection, mainProps, ...rest }) {
    return (_jsxs(AppShell, { padding: "lg", header: { height: 72 }, ...rest, children: [headerSection ? _jsx(AppShell.Header, { children: headerSection }) : null, _jsx(AppShell.Main, { ...mainProps, children: children })] }));
}
