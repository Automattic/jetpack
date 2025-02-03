import { Orientation } from '@visx/axis';
import { ScaleType } from '@visx/scale';
import { LineStyles } from '@visx/xychart';
import type { CSSProperties } from 'react';

type ValueOf< T > = T[ keyof T ];

export type Optional< T, K extends keyof T > = Pick< Partial< T >, K > & Omit< T, K >;

declare type OrientationType = ValueOf< typeof Orientation >;

export type DataPoint = {
	label: string;
	value: number;
};

export type DataPointDate = {
	date: Date;
	value: number | null;
	label?: string;
};

export type SeriesData = {
	group?: string;
	label: string;
	data: DataPointDate[] | DataPoint[];
	options: { gradient?: { from: string; to: string; toOpacity?: number }; stroke?: string };
};

export type MultipleDataPointsDate = {
	label: string;
	data: DataPointDate[];
};

export type DataPointPercentage = {
	/**
	 * Label for the data point
	 */
	label: string;
	/**
	 * Numerical value
	 */
	value: number;
	/**
	 * Formatted value for display
	 */
	valueDisplay?: string;
	/**
	 * Percentage value
	 */
	percentage: number;
	/**
	 * Color code for the segment, by default colours are taken from the theme but this property can overrides it
	 */
	color?: string;
};

/**
 * Theme configuration for chart components
 */
export type ChartTheme = {
	/** Background color for chart components */
	backgroundColor: string;
	/** Background color for labels */
	labelBackgroundColor?: string;
	/** Array of colors used for data visualization */
	colors: string[];
	/** Optional CSS styles for grid lines */
	gridStyles?: CSSProperties;
	/** Length of axis ticks in pixels */
	tickLength: number;
	/** Color of the grid lines */
	gridColor: string;
	/** Color of the grid lines in dark mode */
	gridColorDark: string;
	/** Styles for x-axis tick lines */
	xTickLineStyles?: LineStyles;
	/** Styles for x-axis line */
	xAxisLineStyles?: LineStyles;
};

declare type AxisOptions = {
	orientation?: OrientationType;
	numTicks?: number;
	axisClassName?: string;
	axisLineClassName?: string;
	labelClassName?: string;
	tickClassName?: string;
	tickFormat?: ( value: number ) => string;
};

/**
 * Base properties shared across all chart components
 */
export type BaseChartProps< T = DataPoint | DataPointDate > = {
	/**
	 * Array of data points to display in the chart
	 */
	data: T extends DataPoint | DataPointDate ? T[] : T;
	/**
	 * Additional CSS class name for the chart container
	 */
	className?: string;
	/**
	 * Width of the chart in pixels
	 */
	width?: number;
	/**
	 * Height of the chart in pixels
	 */
	height?: number;
	/**
	 * Size of the chart in pixels for pie and donut charts
	 */
	size?: number;
	/**
	 * Chart margins
	 */
	margin?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
	/**
	 * Whether to show tooltips on hover. False by default.
	 */
	withTooltips?: boolean;
	/**
	 * Whether to show legend
	 */
	showLegend?: boolean;
	/**
	 * Legend orientation
	 */
	legendOrientation?: 'horizontal' | 'vertical';
	/**
	 * Grid visibility. x is default.
	 */
	gridVisibility?: 'x' | 'y' | 'xy' | 'none';

	/**
	 * More options for the chart.
	 */
	options?: {
		yScale?: { type?: ScaleType; zero?: boolean };
		xScale?: { type?: ScaleType };
		axis?: {
			x?: AxisOptions;
			y?: AxisOptions;
		};
	};
};

/**
 * Properties for grid components
 */
export type GridProps = {
	/**
	 * Width of the grid in pixels
	 */
	width: number;
	/**
	 * Height of the grid in pixels
	 */
	height: number;
	/**
	 * Grid visibility. x is default.
	 */
	gridVisibility?: 'x' | 'y' | 'xy' | 'none';
	/**
	 * X-axis scale for the grid
	 * TODO: Fix any type after resolving visx scale type issues
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	xScale: any;
	/**
	 * Y-axis scale for the grid
	 * TODO: Fix any type after resolving visx scale type issues
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	yScale: any;
	/**
	 * Top offset for the grid
	 */
	top?: number;
};
