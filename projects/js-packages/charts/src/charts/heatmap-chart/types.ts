import type { BaseChartProps } from '../../types';
import type { ReactNode } from 'react';

/** A single heatmap cell. `value: null` marks an empty cell. */
export type HeatmapCell = {
	/** Per-cell label used in the tooltip / accessible name. */
	label?: string;
	value: number | null;
	/**
	 * Leave the cell's grid slot empty: nothing is painted and the cell is
	 * skipped by hover and keyboard navigation, while the slot keeps its
	 * place so the rest of the grid doesn't shift. For calendar edges, where
	 * days completing the first/last week fall outside the covered range.
	 */
	hidden?: boolean;
};

/** A heatmap column (rendered left→right); its cells render top→bottom. */
export type HeatmapColumn = {
	/** x-axis label for this column. Empty/omitted renders blank. */
	label?: string;
	data: HeatmapCell[];
};

export type HeatmapTooltipData = {
	value: number | null;
	rowLabel?: string;
	columnLabel?: string;
	cellLabel?: string;
	row: number;
	column: number;
};

export interface HeatmapChartProps
	extends Omit< BaseChartProps< HeatmapColumn[] >, 'showLegend' | 'legend' | 'gridVisibility' > {
	/** y-axis labels by row index. Empty entries render blank. */
	rowLabels?: string[];
	/** Compact mode: hide in-cell values, tighten gap, thin axis labels. Default false. */
	compact?: boolean;
	/** Render the numeric value inside each cell. Default `! compact`. */
	showValues?: boolean;
	/**
	 * Cap a cell's width (px) in non-compact mode. Cells grow up to the cap
	 * and stop instead of splitting the whole container width, so sparse
	 * ranges don't produce oversized cells; narrow containers still shrink
	 * them. Ignored in compact mode, which uses a fixed cell size.
	 */
	maxCellWidth?: number;
	/**
	 * Cap a cell's height (px) in non-compact mode. Applying this cap
	 * content-sizes the chart vertically so rows do not absorb unused height.
	 * Ignored in compact mode, which uses a fixed cell size.
	 */
	maxCellHeight?: number;
	/**
	 * Floor a cell's width (px) in non-compact mode. Below it the grid stops
	 * shrinking and overflows its container instead, so a scrollable wrapper
	 * can take over for long ranges. Default 0 (cells shrink freely).
	 */
	minCellWidth?: number;
	/** Floor a cell's height (px) in non-compact mode; see `minCellWidth`. */
	minCellHeight?: number;
	/**
	 * Color the cell scale interpolates toward at the highest value
	 * (this prop > theme `heatmapChart.primaryColor` > palette `colors[0]`).
	 */
	primaryColor?: string;
	renderTooltip?: ( data: HeatmapTooltipData ) => ReactNode;
	children?: ReactNode;
}
