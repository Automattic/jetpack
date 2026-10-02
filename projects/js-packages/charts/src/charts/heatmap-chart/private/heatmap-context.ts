import { createContext } from 'react';
import type { HeatmapScale } from './heatmap-scale';

export type HeatmapContextValue = {
	extent: [ number, number ];
	/** The resolved primary color; the stylesheet's fallback blend when `scale` is null. */
	primaryColorHex: string;
	/** The fill scale's ends, or null when either color cannot resolve to hex. */
	scale: HeatmapScale | null;
};

/** Shared by the chart and legend without importing back from `heatmap-chart.tsx`. */
export const HeatmapContext = createContext< HeatmapContextValue | null >( null );
