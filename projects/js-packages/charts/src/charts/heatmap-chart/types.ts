import type { BaseChartProps } from '../../types';
import type { ReactNode } from 'react';

/** A single heatmap cell. `value: null` marks an empty cell. */
export type HeatmapCell = {
	/** Per-cell label used in the tooltip / accessible name. */
	label?: string;
	value: number | null;
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
	 * Color the cell scale interpolates toward at the highest value
	 * (this prop > theme `heatmapChart.primaryColor` > palette `colors[0]`).
	 */
	primaryColor?: string;
	renderTooltip?: ( data: HeatmapTooltipData ) => ReactNode;
	children?: ReactNode;
}
