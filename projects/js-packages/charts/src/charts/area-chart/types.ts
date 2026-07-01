import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { RenderTooltipParams } from '../../visx/types';
import type { CurveType } from '../line-chart/types';
import type { ReactNode } from 'react';

export interface AreaChartProps extends BaseChartProps< SeriesData[] > {
	/**
	 * Whether series should be stacked on top of each other.
	 * When false, series are rendered as overlapping filled areas.
	 * @default true
	 */
	stacked?: boolean;
	/**
	 * Stack offset strategy when stacked is true. Mirrors d3-shape stack offsets.
	 * - 'none' (default): values stack at their natural magnitude
	 * - 'expand': values are normalized to the [0,1] range (percentage stacks)
	 * - 'wiggle': used for streamgraphs
	 * - 'silhouette': stack centered around zero
	 */
	stackOffset?: 'none' | 'expand' | 'wiggle' | 'silhouette';
	/**
	 * Smoothing using a Catmull-Rom curve. Ignored if `curveType` is set.
	 */
	smoothing?: boolean;
	/**
	 * Curve interpolation type. Takes precedence over `smoothing`.
	 */
	curveType?: CurveType;
	/**
	 * Custom tooltip renderer.
	 */
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	/**
	 * Whether to show crosshair lines in the tooltip.
	 */
	withTooltipCrosshairs?: {
		showVertical?: boolean;
		showHorizontal?: boolean;
	};
	/**
	 * Fill opacity for the stacked areas. 0–1.
	 * @default 0.85 when stacked, 0.4 when overlapping
	 */
	fillOpacity?: number;
	/**
	 * Whether to render a stroke (line) on top of each area.
	 * @default false when stacked, true when overlapping
	 */
	withStroke?: boolean;
	/**
	 * Enable drag-to-zoom on the X axis. The user drags horizontally to
	 * select a range; the X axis rescales to that range. A small reset
	 * button appears in the top-right of the chart while zoomed.
	 */
	zoomable?: boolean;
	/**
	 * When using an interactive legend, controls whether the Y axis rescales
	 * to fit only the visible series. Defaults to `true`, matching the
	 * intuitive default for LineChart and BarChart. Set to `false` to pin
	 * the Y axis to the full data extent so toggling legend items off does
	 * not move the chart's baseline.
	 * @default true
	 */
	rescaleYOnLegendToggle?: boolean;
	children?: ReactNode;
}
