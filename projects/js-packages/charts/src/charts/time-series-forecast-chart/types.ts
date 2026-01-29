import type { LegendShape } from '@visx/legend/lib/types';
import type { ReactNode } from 'react';

/**
 * Generic accessor type for extracting values from datum
 */
export type Accessor< D, R > = ( d: D, index: number ) => R;

/**
 * Accessors for extracting values from generic datum
 */
export type TimeSeriesForecastAccessors< D > = {
	/**
	 * Accessor function to extract the x-axis date value from each datum
	 */
	x: Accessor< D, Date >;
	/**
	 * Accessor function to extract the y-axis numeric value from each datum
	 */
	y: Accessor< D, number >;
	/**
	 * Optional accessor function to extract the lower bound of the forecast uncertainty
	 */
	yLower?: Accessor< D, number | null | undefined >;
	/**
	 * Optional accessor function to extract the upper bound of the forecast uncertainty
	 */
	yUpper?: Accessor< D, number | null | undefined >;
};

/**
 * Series key labels for legend/tooltip
 */
export type SeriesKeys = {
	/**
	 * Label for the historical series. Default: 'Historical'
	 */
	historical?: string;
	/**
	 * Label for the forecast series. Default: 'Forecast'
	 */
	forecast?: string;
	/**
	 * Label for the uncertainty band. Default: 'Uncertainty'
	 */
	band?: string;
};

/**
 * Internal transformed point (used after accessor extraction)
 */
export type TransformedForecastPoint = {
	date: Date;
	value: number;
	lower: number | null;
	upper: number | null;
	originalIndex: number;
};

/**
 * Band point with guaranteed bounds
 */
export type BandPoint = {
	date: Date;
	lower: number;
	upper: number;
};

/**
 * Tooltip params passed to custom tooltip renderer
 */
export interface ForecastTooltipParams< D > {
	/**
	 * The nearest datum to the cursor
	 */
	nearest: D;
	/**
	 * The x-axis date value
	 */
	x: Date;
	/**
	 * The y-axis numeric value
	 */
	y: number;
	/**
	 * The lower bound of the forecast uncertainty (if available)
	 */
	yLower?: number;
	/**
	 * The upper bound of the forecast uncertainty (if available)
	 */
	yUpper?: number;
	/**
	 * Whether this point is in the forecast region
	 */
	isForecast: boolean;
}

/**
 * Main component props (generic over datum type D)
 */
export interface TimeSeriesForecastChartProps< D > {
	/**
	 * Array of data points to display in the chart
	 */
	data: readonly D[];
	/**
	 * Accessor functions to extract values from each datum
	 */
	accessors: TimeSeriesForecastAccessors< D >;
	/**
	 * The date at which the forecast begins
	 */
	forecastStart: Date;
	/**
	 * Height of the chart in pixels
	 */
	height: number;
	/**
	 * Width of the chart in pixels
	 */
	width?: number;
	/**
	 * Chart margins
	 */
	margin?: { top?: number; right?: number; bottom?: number; left?: number };
	/**
	 * Fixed y-axis domain [min, max]
	 */
	yDomain?: [ number, number ];
	/**
	 * Custom formatter for x-axis tick labels
	 */
	xTickFormat?: ( d: Date ) => string;
	/**
	 * Custom formatter for y-axis tick labels
	 */
	yTickFormat?: ( n: number ) => string;
	/**
	 * Whether to show tooltips on hover. Default: true
	 */
	showTooltip?: boolean;
	/**
	 * Custom labels for series in legend and tooltip
	 */
	seriesKeys?: SeriesKeys;
	/**
	 * Custom tooltip renderer
	 */
	renderTooltip?: ( params: ForecastTooltipParams< D > ) => ReactNode;
	/**
	 * Additional CSS class name for the chart container
	 */
	className?: string;
	/**
	 * Optional unique identifier for the chart
	 */
	chartId?: string;
	/**
	 * Whether to show the legend. Default: false
	 */
	showLegend?: boolean;
	/**
	 * Legend orientation. Default: 'horizontal'
	 */
	legendOrientation?: 'horizontal' | 'vertical';
	/**
	 * Legend position. Default: 'bottom'
	 */
	legendPosition?: 'top' | 'bottom';
	/**
	 * Legend alignment within its position. Default: 'center'
	 */
	legendAlignment?: 'start' | 'center' | 'end';
	/**
	 * Maximum width for legend items. When set, text overflow behavior is controlled by legendTextOverflow.
	 * Should be a CSS value string (e.g. '200px', '50%', '10rem')
	 */
	legendMaxWidth?: string;
	/**
	 * Controls how text behaves when it exceeds legendMaxWidth.
	 * - 'ellipsis': Truncate with ellipsis
	 * - 'wrap': Wrap text to multiple lines (default)
	 */
	legendTextOverflow?: 'ellipsis' | 'wrap';
	/**
	 * Additional CSS class name for legend items.
	 */
	legendItemClassName?: string;
	/**
	 * Legend shape. Default: 'line'
	 */
	legendShape?: LegendShape< D, number >;
	/**
	 * Whether to animate the chart on initial render. Default: false
	 */
	animation?: boolean;
	/**
	 * Grid visibility. Default: 'y'
	 */
	gridVisibility?: 'x' | 'y' | 'xy' | 'none';
	/**
	 * Children for compound composition pattern.
	 * Use TimeSeriesForecastChart.SVG for SVG children and TimeSeriesForecastChart.HTML for HTML children.
	 */
	children?: ReactNode;
}
