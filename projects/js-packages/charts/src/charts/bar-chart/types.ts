import type {
	BaseChartProps,
	DataPointDate,
	SeriesData,
	SeriesChartLegendConfig,
	SeriesVisibilityProps,
} from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { LineStyles } from '@visx/xychart';
import type { CSSProperties, ReactNode } from 'react';

export type BarLayout = 'grouped' | 'overlap';

export type ComparisonMarker = 'square' | 'circle';

/** Resolved paint for the overlap layout: two primaries and their comparison lines. */
export interface BarOverlapStyles {
	outer: { label: string; fill: string; outline: string };
	inner: { label: string; fill: string };
	comparisons: Array< {
		label: string;
		primaryLabel: string;
		stroke: string;
		lineStyles: LineStyles;
		marker: ComparisonMarker;
	} >;
}

export type BandHighlightSelection = {
	datum: DataPointDate;
	key: string;
	index: number;
	x: number;
	y: number;
	width: number;
	height: number;
};

export interface BarChartProps extends BaseChartProps< SeriesData[] >, SeriesVisibilityProps {
	/**
	 * Legend configuration. Supports `collapseGroups` on top of the shared options.
	 */
	legend?: SeriesChartLegendConfig;
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	/** Place the tooltip beside its category without vertical flipping. */
	tooltipPlacement?: 'auto' | 'beside';
	/** Tooltip top anchor in SVG coordinates; negative offsets are supported. */
	tooltipAnchorTop?: number;
	/** Inline styles merged over the tooltip box defaults. */
	tooltipStyle?: CSSProperties;
	/** CSS class for each primary bar, in addition to visx-bar. */
	barClassName?: ( datum: DataPointDate ) => string | undefined;
	orientation?: 'horizontal' | 'vertical';
	/**
	 * `overlap` draws the larger of exactly two visible primaries wide with the smaller centered
	 * in front, vertical only; anything else falls back to `grouped`. Comparisons pair by `group`.
	 */
	layout?: BarLayout;
	withPatterns?: boolean;
	showZeroValues?: boolean;
	/** Highlight the active band across the plot when tooltips are enabled. */
	withBandHighlight?: boolean;
	/** Receive active band bounds in SVG coordinates, or null when dismissed. */
	onBandHighlightChange?: ( selection: BandHighlightSelection | null ) => void;
	children?: ReactNode;
}
