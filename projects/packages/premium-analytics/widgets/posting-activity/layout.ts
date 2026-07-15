/**
 * Pure geometry for the posting-activity calendar heatmap.
 *
 * Given the tile's available width and height, this decides the cell size, how
 * many week columns to render, and the exact pixel rectangle the heatmap should
 * occupy. It is intentionally dependency-free (no React, no charts imports) so it
 * can be lifted into `@automattic/charts` later; the widget owns all policy (mode
 * switching, trimming) around it.
 */

export type CalendarHeatmapLayoutInput = {
	/** Width the tile offers the heatmap, in px. */
	availWidth: number;
	/** Height the tile offers the heatmap, in px. */
	availHeight: number;
	/** Week columns available in the selected range (variable, not a fixed 52). */
	dataColumns: number;
	/** Weekday rows. Defaults to 7. */
	rows?: number;
	/** Cell width / height: 1 (compact) or 61/40 (expanded). Always preserved. */
	aspectRatio: number;
	/** Per-mode cap on cell height, in px. */
	maxCellHeight: number;
	/** Minimum columns to keep before shrinking the cell. Defaults to 4. */
	minColumns?: number;
	/** Gap between cells, in px. */
	gap: number;
	/** Height reserved for the column-label header row, in px. */
	headerHeight: number;
	/** Height reserved for the legend below the grid, in px. */
	legendHeight: number;
	/** Width reserved for the weekday row labels, in px. */
	rowLabelWidth: number;
};

export type CalendarHeatmapLayout = {
	/** Week columns actually rendered (≤ dataColumns). */
	columns: number;
	/** Rendered cell width, in px. */
	cellWidth: number;
	/** Rendered cell height, in px. */
	cellHeight: number;
	/** Total heatmap width (row labels + cells + gaps), in px. */
	heatmapWidth: number;
	/** Total heatmap height (header + legend + cells + gaps), in px. */
	heatmapHeight: number;
};

const ZERO_LAYOUT: CalendarHeatmapLayout = {
	columns: 0,
	cellWidth: 0,
	cellHeight: 0,
	heatmapWidth: 0,
	heatmapHeight: 0,
};

const isPositiveFinite = ( value: number ): boolean => Number.isFinite( value ) && value > 0;

const clamp = ( value: number, min: number, max: number ): number =>
	Math.min( Math.max( value, min ), max );

export type FitCalendarHeatmapColumnsInput = {
	/** Width the tile offers the heatmap, in px. */
	availWidth: number;
	/** Fixed cell width, in px (compact cells do not scale). */
	cellWidth: number;
	/** Gap between cells, in px. */
	gap: number;
	/** Width reserved for the weekday row labels, in px. */
	rowLabelWidth: number;
	/** Week columns available in the selected range. */
	dataColumns: number;
	/** Minimum columns to keep. Defaults to 4. */
	minColumns?: number;
};

/**
 * How many fixed-size cells fit the width without overflowing, bounded by the
 * weeks in range and the column minimum. For compact mode, where the chart draws
 * its own fixed-size squares (grid is `max-content`) and would scroll if given
 * more columns than fit — so unlike the scaling path this must never round up.
 *
 * @param input - The tile width and the fixed cell metrics.
 * @return The column count to trim the data to (0 for a degenerate input).
 */
export function fitCalendarHeatmapColumns( input: FitCalendarHeatmapColumnsInput ): number {
	const { availWidth, cellWidth, gap, rowLabelWidth, dataColumns, minColumns = 4 } = input;

	if (
		! isPositiveFinite( availWidth ) ||
		! isPositiveFinite( cellWidth ) ||
		! isPositiveFinite( dataColumns )
	) {
		return 0;
	}

	const safeGap = Number.isFinite( gap ) && gap > 0 ? gap : 0;
	const safeRowLabelWidth =
		Number.isFinite( rowLabelWidth ) && rowLabelWidth > 0 ? rowLabelWidth : 0;

	// Each rendered column occupies a cell plus one grid gap; floor so the row of
	// cells never exceeds the available width.
	const fit = Math.floor( ( availWidth - safeRowLabelWidth ) / ( cellWidth + safeGap ) );

	return clamp( fit, Math.min( minColumns, dataColumns ), dataColumns );
}

/**
 * Computes the calendar-heatmap layout for a tile.
 *
 * Height drives the cell size (capped per mode); width trims the column count.
 * The aspect ratio is always preserved — when even the minimum column count will
 * not fit at the aspect-preserving cell width, the whole cell is scaled down
 * instead of scrolling or distorting.
 *
 * @param input - The tile geometry and per-mode tuning.
 * @return The chosen column count, cell size, and total heatmap rectangle.
 */
export function computeCalendarHeatmapLayout(
	input: CalendarHeatmapLayoutInput
): CalendarHeatmapLayout {
	const {
		availWidth,
		availHeight,
		dataColumns,
		rows = 7,
		aspectRatio,
		maxCellHeight,
		minColumns = 4,
		gap,
		headerHeight,
		legendHeight,
		rowLabelWidth,
	} = input;

	// Nothing to lay out (collapsed tile or empty range) → a coherent zero layout.
	if (
		! isPositiveFinite( availWidth ) ||
		! isPositiveFinite( availHeight ) ||
		! isPositiveFinite( dataColumns ) ||
		! isPositiveFinite( aspectRatio ) ||
		! isPositiveFinite( rows )
	) {
		return ZERO_LAYOUT;
	}

	const safeGap = Number.isFinite( gap ) && gap > 0 ? gap : 0;
	const safeRowLabelWidth =
		Number.isFinite( rowLabelWidth ) && rowLabelWidth > 0 ? rowLabelWidth : 0;
	const safeHeaderHeight = Number.isFinite( headerHeight ) && headerHeight > 0 ? headerHeight : 0;
	const safeLegendHeight = Number.isFinite( legendHeight ) && legendHeight > 0 ? legendHeight : 0;
	const safeMaxCellHeight = isPositiveFinite( maxCellHeight ) ? maxCellHeight : Infinity;

	// Height drives the cell size: fill the available height (minus overhead and
	// inter-row gaps) up to the per-mode cap, floored at 0.
	const heightForRows = availHeight - safeHeaderHeight - safeLegendHeight - ( rows - 1 ) * safeGap;
	let cellHeight = Math.max( 0, Math.min( heightForRows / rows, safeMaxCellHeight ) );
	let cellWidth = cellHeight * aspectRatio;

	// Never fewer than this many columns unless the range has fewer weeks.
	const requiredMinColumns = Math.min( minColumns, dataColumns );

	// How many aspect-preserving cells fit the available width.
	const widthForCells = availWidth - safeRowLabelWidth + safeGap;
	const fitColumns =
		cellWidth + safeGap > 0 ? Math.floor( widthForCells / ( cellWidth + safeGap ) ) : 0;

	let columns: number;
	if ( fitColumns < requiredMinColumns ) {
		// 4-column-minimum shrink: the aspect-preserving cell is too wide for the
		// minimum column count, so scale the whole cell down (ratio kept) until
		// exactly that many columns fit the width — never scroll, never distort.
		columns = requiredMinColumns;
		const innerWidth = availWidth - safeRowLabelWidth - ( columns - 1 ) * safeGap;
		cellWidth = columns > 0 ? Math.max( 0, innerWidth / columns ) : 0;
		cellHeight = cellWidth / aspectRatio;
	} else {
		// Aspect-preserving cell fits: keep as many columns as the width allows,
		// bounded by the weeks actually in range.
		columns = clamp( fitColumns, requiredMinColumns, dataColumns );
	}

	const heatmapWidth =
		columns > 0 ? safeRowLabelWidth + columns * cellWidth + ( columns - 1 ) * safeGap : 0;
	const heatmapHeight =
		safeHeaderHeight + safeLegendHeight + rows * cellHeight + ( rows - 1 ) * safeGap;

	return {
		columns,
		cellWidth,
		cellHeight,
		heatmapWidth,
		heatmapHeight,
	};
}
