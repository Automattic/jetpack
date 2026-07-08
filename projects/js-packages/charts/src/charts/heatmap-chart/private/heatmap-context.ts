import { createContext } from 'react';

export type HeatmapContextValue = {
	extent: [ number, number ];
	/** The resolved primary color (full intensity); the legend mixes toward it in CSS. */
	primaryColorHex: string;
};

/** Shared by the chart and legend without importing back from `heatmap-chart.tsx`. */
export const HeatmapContext = createContext< HeatmapContextValue | null >( null );
