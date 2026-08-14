import { createContext } from 'react';

/**
 * The nearest element carrying the `--a8c-charts-*` catalog class.
 *
 * All JS token resolution reads this element rather than `document.documentElement`,
 * so a `ThemeProvider` scoped to a subtree retints JS-resolved colours the same way
 * it retints CSS-painted ones.
 */
export const ChartScopeContext = createContext< HTMLElement | null >( null );
