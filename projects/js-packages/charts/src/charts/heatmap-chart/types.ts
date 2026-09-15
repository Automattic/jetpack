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
	/**
	 * Paint the cell as a faded empty slot that carries no claim about the day:
	 * it is set apart from a measured day that scored zero, and skipped by
	 * hover, tooltips, keyboard navigation and the accessibility tree. For grid
	 * filler — slots drawn only so a short range still fills its container,
	 * which were never measured.
	 */
	placeholder?: boolean;
};

/** A heatmap column (rendered left→right); its cells render top→bottom. */
export type HeatmapColumn = {
	/** x-axis label for this column. Empty/omitted renders blank. */
	label?: string;
	data: HeatmapCell[];
	/**
	 * A per-row roll-up such as a total or an average. Left out of the color
	 * scale, drawn unfilled with its figure always printed, on an `auto` track
	 * one gap apart from the data beside it. The chart never computes it.
	 */
	summary?: boolean;
};

/** A run of consecutive columns sharing one label beneath the grid. */
export type HeatmapColumnGroup = {
	label: string;
	/** Columns covered; a positive integer. */
	span: number;
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
	/**
	 * Consecutive runs of columns sharing one label beneath the grid, set one
	 * group gap apart. Runs from the first column; columns past the last group
	 * stay ungrouped. Ignored, with a warning, when a span is not a positive
	 * integer or the spans reach past the last column.
	 */
	columnGroups?: HeatmapColumnGroup[];
	/** Accessible name of the grid. Defaults to a localized "Heatmap chart". */
	ariaLabel?: string;
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
	 * Color the cell scale interpolates toward at the highest value. Defaults to the
	 * first series palette slot, `--a8c-charts-color-series-1`.
	 */
	primaryColor?: string;
	renderTooltip?: ( data: HeatmapTooltipData ) => ReactNode;
	children?: ReactNode;
}

export type CalendarHeatmapResult = {
	data: HeatmapColumn[];
	rowLabels: string[];
};

export type CalendarHeatmapOptions = {
	weekStartsOn?: 0 | 1;
	/**
	 * Mark the days completing the first and last week outside the series' span as
	 * hidden cells rather than blank ones, giving the calendar ragged edges. Days
	 * inside the span stay blank even where the series has no entry.
	 */
	hideOutOfRangeDays?: boolean;
	/**
	 * Draw the grid over this span (`yyyy-MM-dd` bounds) instead of the series' own.
	 * Days inside the grid but outside the series become placeholder cells: painted,
	 * but reporting nothing, since they were never measured. A start bound opens from
	 * the beginning of its week, and bounds narrower than the series are ignored.
	 */
	gridSpan?: { start?: string; end?: string };
	/** BCP-47 tag the labels are written in. Defaults to the runtime's locale. */
	locale?: string;
	/**
	 * IANA zone the series' instants are bucketed into days in. Defaults to the
	 * runtime's zone. A `dateString` carrying no offset is taken as written.
	 */
	timeZone?: string;
};
