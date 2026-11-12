import { createContext } from 'react';
import type { HeatmapBuckets } from './heatmap-buckets';

export type HeatmapContextValue = {
	extent: [ number, number ];
	buckets: HeatmapBuckets;
	/** Which scale the cells paint on, which decides whether the legend may hold its own step count. */
	scale: 'buckets' | 'linear';
	/** How many color steps the cells and the legend share. */
	steps: number;
	/** The custom properties the fill reads, set on the grid and on each legend swatch. */
	fillVars: Record< string, string >;
};

/** Shared by the chart and legend without importing back from `heatmap-chart.tsx`. */
export const HeatmapContext = createContext< HeatmapContextValue | null >( null );
