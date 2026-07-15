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
	/** Week columns available in the selected range. */
	dataColumns: number;
	/** Minimum columns to keep. Defaults to 4. */
	minColumns?: number;
};

const ROW_LABEL_WIDTH = 32;
const COMPACT_CELL_SIZE = 11;
const COMPACT_CELL_GAP = 2;
/**
 * How many fixed-size cells fit the width without overflowing.
 *
 * @param input - The tile width and the fixed cell metrics.
 * @return The column count to trim the data to (0 for a degenerate input).
 */
export function fitCompactCalendarHeatmapColumns( input: FitCalendarHeatmapColumnsInput ): number {
	const { availWidth, dataColumns, minColumns = 6 } = input;

	if ( ! isPositiveFinite( availWidth ) || ! isPositiveFinite( dataColumns ) ) {
		return 0;
	}

	const safeGap =
		Number.isFinite( COMPACT_CELL_GAP ) && COMPACT_CELL_GAP > 0 ? COMPACT_CELL_GAP : 0;

	// Each rendered column occupies a cell plus one grid gap; floor so the row of
	// cells never exceeds the available width.
	const fit = Math.floor( ( availWidth - ROW_LABEL_WIDTH ) / ( COMPACT_CELL_SIZE + safeGap ) );

	return clamp( fit, Math.min( minColumns, dataColumns ), dataColumns );
}

const CELL_GAP = 4;
const HEADER_HEIGHT = 16;
const LEGEND_HEIGHT = 44;

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
		minColumns = 6,
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

	const safeMaxCellHeight = isPositiveFinite( maxCellHeight ) ? maxCellHeight : Infinity;

	// Height drives the cell size: fill the available height (minus overhead and
	// inter-row gaps) up to the per-mode cap, floored at 0.
	const heightForRows = availHeight - HEADER_HEIGHT - LEGEND_HEIGHT - ( rows - 1 ) * CELL_GAP;
	let cellHeight = Math.max( 0, Math.min( heightForRows / rows, safeMaxCellHeight ) );
	let cellWidth = cellHeight * aspectRatio;

	// Never fewer than this many columns unless the range has fewer weeks.
	const requiredMinColumns = Math.min( minColumns, dataColumns );

	// How many aspect-preserving cells fit the available width.
	const widthForCells = availWidth - ROW_LABEL_WIDTH + CELL_GAP;
	const fitColumns =
		cellWidth + CELL_GAP > 0 ? Math.floor( widthForCells / ( cellWidth + CELL_GAP ) ) : 0;

	let columns: number;
	if ( fitColumns < requiredMinColumns ) {
		// 4-column-minimum shrink: the aspect-preserving cell is too wide for the
		// minimum column count, so scale the whole cell down (ratio kept) until
		// exactly that many columns fit the width — never scroll, never distort.
		columns = requiredMinColumns;
		const innerWidth = availWidth - ROW_LABEL_WIDTH - ( columns - 1 ) * CELL_GAP;
		cellWidth = columns > 0 ? Math.max( 0, innerWidth / columns ) : 0;
		cellHeight = cellWidth / aspectRatio;
	} else {
		// Aspect-preserving cell fits: keep as many columns as the width allows,
		// bounded by the weeks actually in range. This branch is only reached when
		// `fitColumns >= requiredMinColumns`, so the minimum needs no re-clamping.
		columns = Math.min( fitColumns, dataColumns );
	}

	const heatmapWidth =
		columns > 0 ? ROW_LABEL_WIDTH + columns * cellWidth + ( columns - 1 ) * CELL_GAP : 0;
	const heatmapHeight = HEADER_HEIGHT + LEGEND_HEIGHT + rows * cellHeight + ( rows - 1 ) * CELL_GAP;

	return {
		columns,
		cellWidth,
		cellHeight,
		heatmapWidth,
		heatmapHeight,
	};
}
