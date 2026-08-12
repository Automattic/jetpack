/**
 * Pure geometry for the calendar heatmap widgets.
 *
 * Given the tile's available width and height, this decides the cell size, how
 * many week columns to render, and the exact pixel rectangle the heatmap should
 * occupy. It is intentionally dependency-free (no React, no charts imports) so it
 * can be lifted into `@automattic/charts` later; the adaptive component owns the
 * trimming policy around it.
 */

export type CalendarHeatmapLayoutInput = {
	/** Width the tile offers the heatmap, in px. */
	availWidth: number;
	/** Height the tile offers the heatmap, in px. */
	availHeight: number;
	/**
	 * Week columns available in the selected range (variable, not a fixed 52).
	 * Omit to let the width decide alone — for a grid that pads a short range with
	 * empty columns rather than leaving the tile part-filled.
	 */
	dataColumns?: number;
	/** Weekday rows. Defaults to 7. */
	rows?: number;
	/**
	 * Cell width / height: 1 (compact) or 61/40 (expanded). Sets the cell's shape
	 * before the width an integer column count leaves over is shared out, so the
	 * rendered cell can be a little wider than this.
	 */
	aspectRatio: number;
	/** Cap on cell height, in px. Omit to fill the available height. */
	maxCellHeight?: number;
	/** Minimum columns to keep before shrinking the cell. Defaults to 6. */
	minColumns?: number;
	/** Legend height in pixels. Pass 0 when the legend is omitted; defaults to 44. */
	legendHeight?: number;
};

export type CalendarHeatmapLayout = {
	/** Week columns actually rendered (≤ `dataColumns` when one was given). */
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

const ROW_LABEL_WIDTH = 32;
const COMPACT_CELL_SIZE = 11;
const COMPACT_CELL_GAP = 2;

export type FitWeekColumnsInput = {
	/** Width the grid has to work with, in px. */
	availWidth: number;
	/** Width of one rendered cell, in px. */
	cellWidth: number;
	/** Gap between cells, in px. */
	cellGap: number;
	/**
	 * Width to reserve for the weekday-label column, in px.
	 *
	 * The chart lays that column out as an `auto` grid track, so its real width is
	 * the label text plus its padding and is not knowable from here. Each caller
	 * passes the allowance its own cell size was designed against — which is why
	 * the compact and design-cell heatmaps reserve different amounts.
	 */
	labelGutter: number;
	/** Never return fewer than this many columns. Defaults to 0. */
	minColumns?: number;
	/** Cap at the weeks the range holds. Omit to let the width decide alone. */
	dataColumns?: number;
};

/**
 * How many whole week columns a width can draw.
 *
 * Every calendar heatmap answers this with the same arithmetic and its own cell
 * metrics, so the formula lives here while the constants stay with each caller.
 */
export function fitWeekColumns( input: FitWeekColumnsInput ): number {
	const { availWidth, cellWidth, cellGap, labelGutter, minColumns = 0, dataColumns } = input;

	// A range holding fewer weeks than the minimum caps it; the minimum cannot
	// conjure columns the data does not have.
	const floorColumns = dataColumns === undefined ? minColumns : Math.min( minColumns, dataColumns );

	if (
		! isPositiveFinite( availWidth ) ||
		! isPositiveFinite( cellWidth ) ||
		( dataColumns !== undefined && ! isPositiveFinite( dataColumns ) )
	) {
		return Math.max( 0, floorColumns );
	}

	// Each rendered column occupies a cell plus one grid gap; floor so the row of
	// cells never exceeds the available width.
	const fitting = Math.floor( ( availWidth - labelGutter ) / ( cellWidth + cellGap ) );

	return Math.max(
		floorColumns,
		0,
		dataColumns === undefined ? fitting : Math.min( fitting, dataColumns )
	);
}

/**
 * How many compact cells a width can hold, ignoring how many the range has.
 *
 * Compact cell dimensions provide a stable proxy for the most week columns worth
 * planning for at this width. Adaptive cells can shrink further in very short
 * tiles, so this is a request-sizing heuristic rather than a layout invariant.
 */
export function compactCalendarHeatmapCapacity( availWidth: number ): number {
	return fitWeekColumns( {
		availWidth,
		cellWidth: COMPACT_CELL_SIZE,
		cellGap: COMPACT_CELL_GAP,
		labelGutter: ROW_LABEL_WIDTH,
	} );
}

const CELL_GAP = 4;
const HEADER_HEIGHT = 16;
const DEFAULT_LEGEND_HEIGHT = 44;

/**
 * Computes the calendar-heatmap layout for a tile.
 *
 * Height drives the cell size; width drives the column count. The grid fills the
 * tile in both directions: the cells take the height, and the width left over by
 * an integer column count goes back into the cells rather than showing as a gap.
 * `aspectRatio` therefore sets the cell's shape before that last adjustment, not
 * after. When even the minimum column count will not fit, the whole cell is scaled
 * down instead of scrolling.
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
		legendHeight = DEFAULT_LEGEND_HEIGHT,
	} = input;

	// Nothing to lay out (collapsed tile, or a range explicitly holding no weeks)
	// → a coherent zero layout.
	if (
		! isPositiveFinite( availWidth ) ||
		! isPositiveFinite( availHeight ) ||
		( dataColumns !== undefined && ! isPositiveFinite( dataColumns ) ) ||
		! isPositiveFinite( aspectRatio ) ||
		! isPositiveFinite( rows )
	) {
		return ZERO_LAYOUT;
	}

	const safeMaxCellHeight = isPositiveFinite( maxCellHeight ) ? maxCellHeight : Infinity;

	// The rows always take the height (minus overhead and inter-row gaps), whatever
	// the width turns out to allow — a narrow tile must not leave the lower two
	// thirds of a tall widget empty.
	const heightForRows = availHeight - HEADER_HEIGHT - legendHeight - ( rows - 1 ) * CELL_GAP;
	const cellHeight = Math.max( 0, Math.min( heightForRows / rows, safeMaxCellHeight ) );

	// Too short to draw a row of cells at all — nothing coherent to lay out.
	if ( cellHeight <= 0 ) {
		return ZERO_LAYOUT;
	}

	// The cell the aspect ratio asks for at that height. It decides how many columns
	// to draw; the rendered width is settled afterwards.
	const targetCellWidth = cellHeight * aspectRatio;

	// Never fewer than this many columns unless the range has fewer weeks.
	const requiredMinColumns =
		dataColumns === undefined ? minColumns : Math.min( minColumns, dataColumns );

	const widthForCells = availWidth - ROW_LABEL_WIDTH + CELL_GAP;
	const fitColumns = Math.floor( widthForCells / ( targetCellWidth + CELL_GAP ) );
	const columns = Math.max(
		requiredMinColumns,
		dataColumns === undefined ? fitColumns : Math.min( fitColumns, dataColumns )
	);

	// The width is what limited the column count whenever the grid draws at least as
	// many columns as the target cell would fit — including the narrow tile forced up
	// to `minColumns`. Then the columns share out the whole width: an integer count
	// otherwise leaves up to a cell of it as a band at the edge, and a tile too narrow
	// for the minimum needs the cells narrower than the ratio rather than shorter than
	// the tile. A grid trimmed to its data keeps the ratio instead, or a few weeks
	// would stretch across the whole tile.
	const cellWidth =
		columns >= fitColumns
			? Math.max( 0, ( availWidth - ROW_LABEL_WIDTH - ( columns - 1 ) * CELL_GAP ) / columns )
			: targetCellWidth;

	const heatmapWidth =
		columns > 0 ? ROW_LABEL_WIDTH + columns * cellWidth + ( columns - 1 ) * CELL_GAP : 0;
	const heatmapHeight = HEADER_HEIGHT + legendHeight + rows * cellHeight + ( rows - 1 ) * CELL_GAP;

	return {
		columns,
		cellWidth,
		cellHeight,
		heatmapWidth,
		heatmapHeight,
	};
}
