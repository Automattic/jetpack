import { createContext } from 'react';

/**
 * The nearest chart element, published so JS token resolution reads the same CSS cascade that paints the chart's own colours.
 *
 * All JS token resolution reads this element rather than `document.documentElement`, so a `getComputedStyle` call sees the same `--a8c-charts-*` values — including any override set inside the provider tree — that a CSS-painted sibling element does.
 */
export const ChartScopeContext = createContext< HTMLElement | null >( null );
