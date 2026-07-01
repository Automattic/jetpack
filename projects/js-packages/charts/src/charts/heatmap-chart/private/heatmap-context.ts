import { createContext } from 'react';

export type HeatmapContextValue = {
	extent: [ number, number ];
	/** The resolved primary color (full intensity); the legend mixes toward it in CSS. */
	primaryColorHex: string;
};

/**
 * Shared between the chart and its legend. Kept in its own module (rather than
 * exported from `heatmap-chart.tsx`) so the legend can consume it without an
 * import cycle back to the chart component.
 */
export const HeatmapContext = createContext< HeatmapContextValue | null >( null );
