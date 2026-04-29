import type { BaseChartProps, DataPointDate, SeriesData } from '../../types';
import type { CurveType } from '../line-chart/types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { ReactNode } from 'react';

export type AreaChartTooltipDatum = {
	key: string;
	value: number;
};

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
	children?: ReactNode;
}
