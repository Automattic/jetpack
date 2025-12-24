import type { CircleSubjectProps } from '@visx/annotation/lib/components/CircleSubject';
import type { ConnectorProps } from '@visx/annotation/lib/components/Connector';
import type { LabelProps } from '@visx/annotation/lib/components/Label';
import type { LineSubjectProps } from '@visx/annotation/lib/components/LineSubject';
import type { AxisScale, Orientation, TickFormatter, AxisRendererProps } from '@visx/axis';
import type { LegendShape } from '@visx/legend/lib/types';
import type { ScaleInput, ScaleType } from '@visx/scale';
import type { TextProps } from '@visx/text/lib/Text';
import type { EventHandlerParams, GlyphProps, GridStyles, LineStyles } from '@visx/xychart';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import type { GoogleDataTableColumn, GoogleDataTableRow } from 'react-google-charts';

type ValueOf< T > = T[ keyof T ];

export type Optional< T, K extends keyof T > = Pick< Partial< T >, K > & Omit< T, K >;

export type OrientationType = ValueOf< typeof Orientation >;

export type AnnotationStyles = {
	circleSubject?: Omit< CircleSubjectProps, 'x' | 'y' > & { fill?: string };
	lineSubject?: Omit< LineSubjectProps, 'x' | 'y' >;
	connector?: Omit< ConnectorProps, 'x' | 'y' | 'dx' | 'dy' >;
	label?: Omit< LabelProps, 'title' | 'subtitle' | 'x' | 'y' > & {
		x?: number | 'start' | 'end';
		y?: number | 'start' | 'end';
	};
};

export type DataPoint = {
	label: string;
	value: number;
};

/**
 * Data format for GeoChart - uses Google Charts native data format for maximum flexibility.
 * First element is the header row, subsequent elements are data rows.
 *
 * Country identifiers can be either full country names or ISO 3166-1 alpha-2 codes (e.g., 'United States' or 'US').
 * Full names are recommended for better readability in tooltips.
 *
 * @example Basic usage with country names:
 * [['Country', 'Value'], ['United States', 100], ['Canada', 50], ['United Kingdom', 75]]
 *
 * @example With custom HTML tooltips:
 * [
 *   ['Country', 'Value', { type: 'string', role: 'tooltip', p: { html: true } }],
 *   ['United States', 100, '<b>United States</b><br/>100 visitors'],
 *   ['Canada', 50, '<b>Canada</b><br/>50 visitors']
 * ]
 *
 * @example With formatted values (v = value, f = formatted):
 * [
 *   ['Country', 'Value'],
 *   ['United States', { v: 100, f: '100 visitors' }],
 *   ['Canada', { v: 50, f: '50 visitors' }]
 * ]
 *
 * @example With multiple columns:
 * [
 *   ['Country', 'Population', 'Area'],
 *   ['United States', 331000000, 9834000],
 *   ['Canada', 38000000, 9985000]
 * ]
 */
export type GeoData = [ GoogleDataTableColumn[], ...GoogleDataTableRow[] ];

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

export type LeaderboardEntry = {
	/**
	 * Unique internal key (e.g., 'key-direct')
	 */
	id: string;

	/**
	 * Human-readable name (e.g., 'Direct') or a JSX element (e.g., <h4>Direct</h4>)
	 */
	label: string | JSX.Element;

	/**
	 * Value of the entry
	 */
	currentValue: number;

	/**
	 * Value of the entry in the previous period
	 */
	previousValue: number;

	/**
	 * Width of current bar, as % of the current value
	 */
	currentShare: number;

	/**
	 * Width of previous bar, as % of the current value
	 */
	previousShare: number;

	/**
	 * Delta of the entry
	 */
	delta: number;

	/**
	 * Optional color for the entry's image/icon
	 */
	imageColor?: string;
};

export type GradientStop = {
	offset: string;
	color?: string;
	opacity?: number;
};

export type SeriesDataOptions = {
	gradient?: {
		from: string;
		to: string;
		fromOpacity?: number;
		toOpacity?: number;
		stops?: GradientStop[];
	};
	stroke?: string;
	seriesLineStyle?: LineStyles;
	legendShapeStyle?: CSSProperties;
	type?: 'comparison';
};

export type SeriesData = {
	group?: string;
	label: string;
	data: DataPointDate[] | DataPoint[];
	options?: SeriesDataOptions;
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
	/**
	 * Group for the data point, used to match color with groups on other charts
	 */
	group?: string;
};

/**
 * Base theme configuration for chart components with optional properties
 */
export type ChartTheme = {
	/** Background color for chart components */
	backgroundColor: string;
	/** Background color for labels */
	labelBackgroundColor?: string;
	/** Text color for labels */
	labelTextColor?: string;
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
	legendShapeStyles?: Record< string, unknown >[];
	/** Array of render functions for glyphs */
	glyphs?: Array< < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode >;
	/** Styles for legend labels */
	legendLabelStyles?: CSSProperties;
	/** Styles for legend container */
	legendContainerStyles?: CSSProperties;
	/** Styles for small SVG text (eg. axis tick labels), passed through to the XYChart theme. */
	svgLabelSmall?: TextProps;
	annotationStyles?: AnnotationStyles;
	/** GeoChart specific settings */
	geoChart?: {
		/** Default fill color for a geo chart feature (e.g. country) with no data */
		featureFillColor?: string;
	};
	/** LeaderboardChart specific settings */
	leaderboardChart?: {
		/** Gap between rows in the leaderboard grid */
		rowGap?: number;
		/** Gap between columns in the leaderboard grid */
		columnGap?: number;
		/** Spacing between label and progress bars */
		labelSpacing?: number;
		/** Primary color for current period bars */
		primaryColor?: string;
		/** Secondary color for comparison period bars */
		secondaryColor?: string;
		/** Delta colors: [negative, neutral, positive] */
		deltaColors?: [ string, string, string ];
	};
	/** ConversionFunnelChart specific settings */
	conversionFunnelChart?: {
		/** Primary color for funnel bars */
		primaryColor?: string;
		/** Background color for chart container */
		backgroundColor?: string;
		/** Color for positive change indicators */
		positiveChangeColor?: string;
		/** Color for negative change indicators */
		negativeChangeColor?: string;
	};
	lineChart?: {
		lineStyles?: Partial< Record< NonNullable< SeriesDataOptions[ 'type' ] >, LineStyles > >;
	};
	/** Sparkline specific settings */
	sparkline?: {
		/** Margin around the sparkline chart */
		margin?: {
			top?: number;
			right?: number;
			bottom?: number;
			left?: number;
		};
		/** Stroke width for the sparkline line */
		strokeWidth?: number;
	};
	/** SegmentedBar specific settings */
	segmentedBar?: {
		/** Height of the bar in pixels */
		height?: number;
		/** Gap between segments in pixels */
		gap?: number;
		/** Corner radius for the bar ends */
		borderRadius?: number;
		/** Default color for markers */
		markerColor?: string;
	};
};

/**
 * Theme configuration with all properties guaranteed to be defined.
 * Useful for merged themes where defaults are provided for all optional properties.
 */
export type CompleteChartTheme = Required< ChartTheme > & {
	leaderboardChart: Omit<
		Required< NonNullable< ChartTheme[ 'leaderboardChart' ] > >,
		'primaryColor' | 'secondaryColor'
	> &
		Pick< NonNullable< ChartTheme[ 'leaderboardChart' ] >, 'primaryColor' | 'secondaryColor' >;
	conversionFunnelChart: Omit<
		Required< NonNullable< ChartTheme[ 'conversionFunnelChart' ] > >,
		'primaryColor'
	> &
		Pick< NonNullable< ChartTheme[ 'conversionFunnelChart' ] >, 'primaryColor' >;
	lineChart: {
		lineStyles: Record< NonNullable< SeriesDataOptions[ 'type' ] >, LineStyles >;
	};
	sparkline: Required< NonNullable< ChartTheme[ 'sparkline' ] > > & {
		margin: Required< NonNullable< ChartTheme[ 'sparkline' ] >[ 'margin' ] >;
	};
	segmentedBar: Required< NonNullable< ChartTheme[ 'segmentedBar' ] > >;
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
	 * Whether to display this axis. Defaults to true.
	 */
	display?: boolean;
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
export type BaseChartProps< T = DataPoint | DataPointDate | LeaderboardEntry > = {
	/**
	 * Array of data points to display in the chart
	 */
	data: T extends DataPoint | DataPointDate | LeaderboardEntry ? T[] : T;
	/**
	 * Optional unique identifier for the chart (auto-generated if not provided)
	 */
	chartId?: string;
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
	onPointerDown?: ( event: EventHandlerParams< DataPoint | DataPointDate > ) => void;
	/**
	 * Callback function for pointer up event
	 */
	onPointerUp?: ( event: EventHandlerParams< DataPoint | DataPointDate > ) => void;
	/**
	 * Callback function for pointer move event
	 */
	onPointerMove?: ( event: EventHandlerParams< DataPoint | DataPointDate > ) => void;
	/**
	 * Callback function for pointer out event
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
	 * Legend position (where the legend appears)
	 * TODO: Add 'left' | 'right' positioning support in future implementation
	 */
	legendPosition?: 'top' | 'bottom';
	/**
	 * Legend alignment within its position
	 */
	legendAlignment?: 'start' | 'center' | 'end';
	/**
	 * Maximum width for legend items. When set, text overflow behavior is controlled by legendTextOverflow.
	 * Should be a CSS value string (e.g. '200px', '50%', '10rem')
	 */
	legendMaxWidth?: string;
	/**
	 * Controls how text behaves when it exceeds legendMaxWidth.
	 * - 'ellipsis': Truncate with ellipsis (ideal for widgets/small devices)
	 * - 'wrap': Wrap text to multiple lines (default, ideal for larger displays)
	 */
	legendTextOverflow?: 'ellipsis' | 'wrap';
	/**
	 * Additional CSS class name for legend items.
	 * This allows consumers to customize individual legend item styling.
	 */
	legendItemClassName?: string;
	/**
	 * Enable interactive legend items that can toggle series visibility.
	 * Supported for LineChart, PieChart, and PieSemiCircleChart.
	 * Requires chartId and GlobalChartsProvider.
	 * For pie charts, percentages are recalculated so visible segments total 100%.
	 */
	legendInteractive?: boolean;
	/**
	 * Grid visibility. x is default when orientation is vertical. y is default when orientation is horizontal.
	 */
	gridVisibility?: 'x' | 'y' | 'xy' | 'none';
	/**
	 * Whether to show chart animation on initial render or not
	 */
	animation?: boolean;

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

/**
 * Local type definitions for Popover API attributes and events
 * These are used to avoid extending React module types while still getting type safety
 * NOTE: These type definitions are only needed for React 18 and below.
 * React 19+ includes Popover API types in the official React type definitions, so these can be removed when upgrading.
 */
export interface PopoverButtonAttributes {
	popovertarget?: string;
	popovertargetaction?: 'hide' | 'show' | 'toggle';
}

export interface PopoverElementAttributes {
	popover?: 'auto' | 'manual' | '';
}

// Combined types for spreading into JSX elements
export type ButtonWithPopover = PopoverButtonAttributes;
export type PopoverElement = PopoverElementAttributes;

// ToggleEvent for native Popover API
export interface ToggleEvent extends Event {
	newState: 'open' | 'closed';
	oldState: 'open' | 'closed';
}
