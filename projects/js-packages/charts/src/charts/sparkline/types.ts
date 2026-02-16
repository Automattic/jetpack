export type SparklineDataPoint = number;

export type GradientConfig = {
	/**
	 * Start color for gradient (defaults to color prop)
	 */
	from?: string;
	/**
	 * End color for gradient (defaults to theme backgroundColor)
	 */
	to?: string;
	/**
	 * Start opacity (0-1)
	 * @default 0.5
	 */
	fromOpacity?: number;
	/**
	 * End opacity (0-1)
	 * @default 0.0
	 */
	toOpacity?: number;
};

export interface SparklineProps {
	/**
	 * Array of numeric values to plot
	 * @example [10, 25, 15, 30, 22, 35]
	 */
	data: SparklineDataPoint[];

	/**
	 * Width of the sparkline in pixels
	 * @default 100
	 */
	width?: number;

	/**
	 * Height of the sparkline in pixels
	 * @default 40
	 */
	height?: number;

	/**
	 * Size (used by responsive variant, equivalent to width for square charts)
	 */
	size?: number;

	/**
	 * Color for the line stroke (hex or CSS color)
	 * @default Theme color (first color in theme.colors array)
	 */
	color?: string;

	/**
	 * Line stroke width in pixels
	 * @default 1
	 */
	strokeWidth?: number;

	/**
	 * Whether to render the gradient fill beneath the line
	 * @default true
	 */
	withGradientFill?: boolean;

	/**
	 * Gradient configuration for area fill
	 * If not provided, uses color prop with default opacity values
	 */
	gradient?: GradientConfig;

	/**
	 * Additional CSS class name
	 */
	className?: string;

	/**
	 * Chart ID for unique gradient/element identification
	 */
	chartId?: string;

	/**
	 * Margin around the chart
	 * @default { top: 2, right: 2, bottom: 2, left: 2 }
	 */
	margin?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};

	/**
	 * Enable entry animation on initial render
	 * Creates a rising effect where the line scales up from the bottom.
	 * Automatically respects user's prefers-reduced-motion system setting.
	 * @default false
	 */
	animation?: boolean;
}
