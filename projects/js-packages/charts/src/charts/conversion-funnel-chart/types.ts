import type { BaseChartProps } from '../../types';

/**
 * Represents a single step in the conversion funnel
 */
export interface FunnelStep {
	/** Step identifier */
	id: string;
	/** Display label for the step */
	label: string;
	/** Conversion rate as percentage (0-100) */
	rate: number;
	/** Absolute count (optional, for tooltip/details) */
	count?: number;
}

/**
 * Render prop for customizing step labels
 */
export interface StepLabelRenderProps {
	step: FunnelStep;
	index: number;
	className?: string;
}

/**
 * Render prop for customizing step rates
 */
export interface StepRateRenderProps {
	step: FunnelStep;
	index: number;
	className?: string;
}

/**
 * Render prop for customizing the entire main metric section
 */
export interface MainMetricRenderProps {
	mainRate: number;
	changeIndicator?: string;
	className?: string;
	changeColor?: string;
}

/**
 * Render prop for customizing tooltip content
 */
export interface TooltipRenderProps {
	step: FunnelStep;
	index: number;
	top: number;
	left: number;
	className?: string;
}

/**
 * Props for the ConversionFunnelChart component
 */
export interface ConversionFunnelChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'animation' > {
	/** Main conversion rate to highlight */
	mainRate: number;
	/** Change indicator (e.g., +2%, -1.5%) */
	changeIndicator?: string;
	/** Array of funnel steps */
	steps: FunnelStep[];
	/** Whether the chart is in loading state */
	loading?: boolean;
	/** Height of the chart container. Accepts a number (pixels) or CSS string (e.g., "400px", "100%"). Falls back to style.height if set, otherwise defaults to "100%". */
	height?: string | number;
	/** Custom styling */
	style?: React.CSSProperties;
	/** Custom render function for step labels */
	renderStepLabel?: ( props: StepLabelRenderProps ) => React.ReactNode;
	/** Custom render function for step rates */
	renderStepRate?: ( props: StepRateRenderProps ) => React.ReactNode;
	/** Custom render function for the entire main metric section */
	renderMainMetric?: ( props: MainMetricRenderProps ) => React.ReactNode;
	/** Custom render function for tooltip content */
	renderTooltip?: ( props: TooltipRenderProps ) => React.ReactNode;
}
