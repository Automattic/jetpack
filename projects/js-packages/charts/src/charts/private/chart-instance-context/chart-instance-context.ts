import { createContext } from 'react';
import type { BaseLegendItem } from '../../../components/legend';
import type { ChartType } from '../../../types';

export interface ChartInstanceRef {
	getScales: () => { xScale: unknown; yScale: unknown } | null;
	getChartDimensions: () => {
		width: number;
		height: number;
		margin: { top?: number; right?: number; bottom?: number; left?: number };
	};
}

// Local context for chart implicit state sharing
export interface ChartInstanceContextValue {
	chartId: string;
	chartRef?: React.RefObject< ChartInstanceRef >;
	chartWidth?: number;
	chartHeight?: number;
	isSeriesVisible?: ( seriesLabel: string ) => boolean;
	/**
	 * The chart's legend items, for a legend inside it. The registry carries the same items
	 * to a legend anywhere on the page, but fills from an effect, a frame after the chart
	 * renders, which is too late for a legend the chart's own layout is sized around.
	 */
	legendItems?: BaseLegendItem[];
	/** The chart's type, which gives a legend inside it its default shape. */
	chartType?: ChartType;
}

export const ChartInstanceContext = createContext< ChartInstanceContextValue | null >( null );
