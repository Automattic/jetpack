import { createContext } from 'react';

export type HeatmapContextValue = {
	extent: [ number, number ];
	/** The custom properties the fill reads, set on the grid and on each legend swatch. */
	fillVars: Record< string, string >;
};

/** Shared by the chart and legend without importing back from `heatmap-chart.tsx`. */
export const HeatmapContext = createContext< HeatmapContextValue | null >( null );
