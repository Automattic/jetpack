/**
 * Pure geometry for the calendar heatmap widgets: given the tile's width/height,
 * decides cell size, column count, and the exact heatmap rectangle. Deliberately
 * dependency-free (no React/charts) so it can move into `@automattic/charts` later.
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
// Gaps and floors are legitimately zero, so they need a wider test than a width.
const isNonNegativeFinite = ( value: number ): boolean => Number.isFinite( value ) && value >= 0;

/**
 * Allowance for the chart's weekday-label column (an `auto` grid track sized by
 * its own text). Measured at 27.34px — widest label "Wed" at 11px font + 4px
 * padding — rounded up for font variance across platforms; labels are locale-invariant.
 */
const ROW_LABEL_WIDTH = 32;
const COMPACT_CELL_SIZE = 11;
const COMPACT_CELL_GAP = 2;

export type FitWeekColumnsInput = {
	/** Width the grid has to work with, in px. */
	availWidth: number;
	cellWidth: number;
	cellGap: number;
	/**
	 * Floor for the returned count, and the count returned when the metrics are
	 * unusable. Defaults to 0.
	 */
	minColumns?: number;
};

/**
 * How many whole week columns a width can draw at a fixed cell size (grid is
 * `auto repeat(n, …)`, so n columns carry n gaps). Not interchangeable with
 * `computeCalendarHeatmapLayout`, which sizes from height first and counts n-1 gaps.
 */
export function fitWeekColumns( input: FitWeekColumnsInput ): number {
	const { availWidth, cellWidth, cellGap, minColumns = 0 } = input;

	// Normalized rather than trusted: `minColumns` leaves through both branches, so a
	// NaN or fractional value would reach the caller and size a data request with it.
	const floorColumns = isNonNegativeFinite( minColumns ) ? Math.floor( minColumns ) : 0;

	// Guard every metric the arithmetic touches: an unchecked one divides by zero
	// or carries a NaN out.
	if (
		! isPositiveFinite( availWidth ) ||
		! isPositiveFinite( cellWidth ) ||
		! isNonNegativeFinite( cellGap )
	) {
		return floorColumns;
	}

	// Floor so the row of cells never exceeds the available width.
	const fitting = Math.floor( ( availWidth - ROW_LABEL_WIDTH ) / ( cellWidth + cellGap ) );

	return Math.max( floorColumns, fitting );
}

/**
 * How many compact cells a width can hold, ignoring how many the range has —
 * a stable proxy for request sizing. Adaptive cells can shrink further in very
 * short tiles, so this is a heuristic, not a layout invariant.
 */
export function compactCalendarHeatmapCapacity( availWidth: number ): number {
	return fitWeekColumns( {
		availWidth,
		cellWidth: COMPACT_CELL_SIZE,
		cellGap: COMPACT_CELL_GAP,
	} );
}

// Exported for widgets that mirror the chart's non-compact grid geometry (e.g.
// deriving a cell height from a measured tile), so the metrics are stated once.
export const CELL_GAP = 4;
export const HEADER_HEIGHT = 16;
const DEFAULT_LEGEND_HEIGHT = 44;

/**
 * Computes the calendar-heatmap layout for a tile. Height drives cell size,
 * width drives column count, and leftover width from an integer column count
 * goes back into the cells rather than showing as a gap. Never scrolls — an unfit minimum shrinks the cell instead.
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

	// The rows always take the height (minus overhead and gaps), whatever the width
	// allows — a narrow tile must not leave the lower two-thirds of a tall widget empty.
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

	// Width-limited (columns >= fitColumns, incl. minColumns forcing) shares leftover
	// width across cells, which can widen past the ratio; data-limited (fewer weeks
	// than fit) keeps the exact ratio so a short range doesn't stretch to fill the tile.
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
