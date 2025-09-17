import type { ChartTypes } from './constants';
import type { BaseLegendItem } from '../../components/legend';
import type { CompleteChartTheme } from '../../types';
export type ChartType = keyof typeof ChartTypes;

export interface ChartRegistration {
	legendItems: BaseLegendItem[];
	chartType: ChartType;
	metadata?: Record< string, unknown >;
}

export interface GlobalChartsContextValue {
	charts: Map< string, ChartRegistration >;
	registerChart: ( id: string, data: ChartRegistration ) => void;
	unregisterChart: ( id: string ) => void;
	getChartData: ( id: string ) => ChartRegistration | undefined;
	/** Theme provided by the GlobalChartsProvider (merged with defaults) */
	theme: CompleteChartTheme;
	/**
	 * Resolve a stable color for a series.
	 * - If an override color is passed, it wins.
	 * - If a group is provided, returns a stable color per group across charts.
	 * - If no group, falls back to index-based color from the theme palette.
	 */
	resolveGroupColor: ( params: {
		group?: string;
		index: number;
		overrideColor?: string;
	} ) => string;
}
