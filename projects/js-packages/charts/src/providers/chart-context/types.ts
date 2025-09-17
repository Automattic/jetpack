import type { BaseLegendItem } from '../../components/legend';
import type { CompleteChartTheme, DataPointPercentage, SeriesData } from '../../types';
import type { LineStyles } from '@visx/xychart';

export interface ChartRegistration {
	legendItems: BaseLegendItem[];
	chartType: string;
	metadata?: Record< string, unknown >;
}

export type GetElementStylesParams = {
	index: number;
	data?: SeriesData | DataPointPercentage | BaseLegendItem;
	overrideColor?: string;
};

export type ElementStyles = {
	color: string;
	lineStyles: LineStyles;
};

export interface GlobalChartsContextValue {
	charts: Map< string, ChartRegistration >;
	registerChart: ( id: string, data: ChartRegistration ) => void;
	unregisterChart: ( id: string ) => void;
	getChartData: ( id: string ) => ChartRegistration | undefined;
	/** Theme provided by the GlobalChartsProvider (merged with defaults) */
	theme: CompleteChartTheme;
	/**
	 * Get the styles for a series.
	 */
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles;
}
