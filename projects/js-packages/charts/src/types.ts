import type { AxisScale, Orientation, TickFormatter, AxisRendererProps } from '@visx/axis';
import type { LegendShape } from '@visx/legend/lib/types';
import type { ScaleInput, ScaleType } from '@visx/scale';
import type { EventHandlerParams, GlyphProps, GridStyles, LineStyles } from '@visx/xychart';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';

type ValueOf< T > = T[ keyof T ];

export type Optional< T, K extends keyof T > = Pick< Partial< T >, K > & Omit< T, K >;

export type OrientationType = ValueOf< typeof Orientation >;

export type DataPoint = {
	label: string;
	value: number;
};

export type DataPointDate = {
	date?: Date;
	/**
	 * Supported Formats:
	 * - YYYY-MM-DD (local)
	 * - YYYY-MM-DD HH:mm:ss (local)
	 * - YYYY-MM-DD HH:mm (local)
	 * - YYYY-MM-DDTHH:mm:ss (local)
	 * - YYYY-MM-DDTHH:mm:ss.SSS (local)
	 * - YYYY-MM-DDTHH:mm (local)
	 * - YYYY-MM-DDTHH:mm:ssZ (UTC → local)
	 * - YYYY-MM-DDTHH:mm:ss±HH:mm (offset → local)
	 */
	dateString?: string;
	value: number | null;
	label?: string;
};

export type SeriesData = {
	group?: string;
	label: string;
	data: DataPointDate[] | DataPoint[];
	options?: {
		gradient?: { from: string; to: string; fromOpacity?: number; toOpacity?: number };
		stroke?: string;
		seriesLineStyle?: LineStyles;
		legendShapeStyle?: CSSProperties;
	};
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
	gridStyles?: GridStyles;
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
	/** Styles for series lines */
	seriesLineStyles?: LineStyles[];
	/** Styles for legend shapes */
	legendShapeStyles?: CSSProperties[];
	/** Array of render functions for glyphs */
	glyphs?: Array< < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode >;
	/** Styles for legend labels */
	legendLabelStyles?: CSSProperties;
	/** Styles for legend container */
	legendContainerStyles?: CSSProperties;
};

declare type AxisOptions = {
	orientation?: OrientationType;
	numTicks?: number;
	axisClassName?: string;
	axisLineClassName?: string;
	labelClassName?: string;
	tickClassName?: string;
	tickFormat?: TickFormatter< ScaleInput< AxisScale > >;
	/**
	 * For more control over rendering or to add event handlers to datum, pass a function as children.
	 */
	children?: ( renderProps: AxisRendererProps< AxisScale > ) => ReactNode;
};

export type ScaleOptions = {
	type?: ScaleType;
	zero?: boolean;
	domain?: [ number, number ];
	range?: [ number, number ];
	/**
	 * For band scale, shortcut for setting `paddingInner` and `paddingOuter` to the same value.
	 *
	 * For point scale, the outer padding (spacing) at the ends of the range.
	 * This is similar to band scale's `paddingOuter`.
	 *
	 */
	padding?: number;
	/**
	 * The inner padding (spacing) within each band step of band scales, as a fraction of the step size. This value must lie in the range [0,1].
	 *
	 */
	paddingInner?: number;
	/**
	 * The outer padding (spacing) at the ends of the range of band and point scales,
	 * as a fraction of the step size. This value must lie in the range [0,1].
	 *
	 */
	paddingOuter?: number;
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
	 * Callback function for pointer down event
	 */
	onPointerDown?: ( event: EventHandlerParams< object > ) => void;
	/**
	 * Callback function for pointer down event
	 */
	onPointerUp?: ( event: EventHandlerParams< object > ) => void;
	/**
	 * Callback function for pointer down event
	 */
	onPointerMove?: ( event: EventHandlerParams< object > ) => void;
	/**
	 * Callback function for pointer up event
	 */
	onPointerOut?: ( event: PointerEvent< Element > ) => void;
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
	 * Legend shape
	 */
	legendShape?: LegendShape< T, number >;
	/**
	 * Legend horizontal alignment
	 */
	legendAlignmentHorizontal?: 'left' | 'center' | 'right';
	/**
	 * Legend vertical alignment
	 */
	legendAlignmentVertical?: 'top' | 'bottom';
	/**
	 * Grid visibility. x is default when orientation is vertical. y is default when orientation is horizontal.
	 */
	gridVisibility?: 'x' | 'y' | 'xy' | 'none';

	/**
	 * More options for the chart.
	 */
	options?: {
		yScale?: ScaleOptions;
		xScale?: ScaleOptions;
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
