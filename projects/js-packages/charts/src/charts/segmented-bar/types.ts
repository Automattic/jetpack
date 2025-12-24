/**
 * Single segment in the segmented bar
 */
export interface SegmentedBarSegment {
	/**
	 * Numeric value for this segment.
	 * In 'proportional' mode, determines segment width relative to total.
	 * In 'equal' mode, used for tooltip/label display only.
	 */
	value: number;

	/**
	 * Optional label for the segment (used in tooltips)
	 */
	label?: string;

	/**
	 * Optional color override for this segment.
	 * If not provided, uses theme colors by index.
	 */
	color?: string;
}

/**
 * Marker configuration for indicating a position on the bar
 */
export interface SegmentedBarMarker {
	/**
	 * Position value where the marker should appear.
	 * Interpreted as cumulative value from left (0 to total).
	 */
	value: number;

	/**
	 * Optional tooltip text for the marker
	 */
	tooltip?: string;

	/**
	 * Whether to animate the marker position
	 * @default false
	 */
	showAnimation?: boolean;

	/**
	 * Marker color (defaults to theme segmentedBar.markerColor)
	 */
	color?: string;
}

/**
 * Display mode for segment sizing
 */
export type SegmentedBarMode = 'proportional' | 'equal';

export interface SegmentedBarProps {
	/**
	 * Array of segments to display.
	 * Can be simple numbers or full segment objects.
	 */
	values: number[] | SegmentedBarSegment[];

	/**
	 * Display mode for segments.
	 * - 'proportional': Segment widths based on their values (default)
	 * - 'equal': All segments have equal width
	 * @default 'proportional'
	 */
	mode?: SegmentedBarMode;

	/**
	 * Custom colors for segments (overrides theme colors)
	 * Applied in order to segments
	 */
	colors?: string[];

	/**
	 * Optional marker to indicate a position on the bar
	 */
	marker?: SegmentedBarMarker;

	/**
	 * Whether to show cumulative value labels below the bar
	 * @default true
	 */
	showLabels?: boolean;

	/**
	 * Width of the bar in pixels
	 * @default 300
	 */
	width?: number;

	/**
	 * Height of the bar in pixels
	 * @default 8
	 */
	height?: number;

	/**
	 * Gap between segments in pixels
	 * @default 0
	 */
	gap?: number;

	/**
	 * Corner radius for the bar ends
	 * @default 4
	 */
	borderRadius?: number;

	/**
	 * Additional CSS class name
	 */
	className?: string;

	/**
	 * Chart ID for unique element identification
	 */
	chartId?: string;

	/**
	 * Format function for label values
	 * @default (value) => value.toString()
	 */
	labelFormatter?: ( value: number ) => string;

	/**
	 * Whether to show tooltips on hover
	 * @default false
	 */
	withTooltips?: boolean;
}

/**
 * Responsive configuration for SegmentedBar
 */
export type SegmentedBarResponsiveConfig = {
	/**
	 * The maximum width of the chart. Defaults to 1200.
	 */
	maxWidth?: number;
	/**
	 * Child render updates upon resize are delayed until debounceTime milliseconds
	 * after the last resize event.
	 */
	resizeDebounceTime?: number;
};
