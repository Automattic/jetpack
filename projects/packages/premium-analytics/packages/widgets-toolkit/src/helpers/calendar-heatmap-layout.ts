/**
 * Pure geometry for the calendar heatmap widgets. Deliberately dependency-free
 * (no React/charts) so it can move into `@automattic/charts` later.
 */

const isPositiveFinite = ( value: number ): boolean => Number.isFinite( value ) && value > 0;
// Gaps and floors are legitimately zero, so they need a wider test than a width.
const isNonNegativeFinite = ( value: number ): boolean => Number.isFinite( value ) && value >= 0;

/**
 * Allowance for the chart's weekday-label column (an `auto` grid track sized by
 * its own text). Measured at 27.34px — widest label "Wed" at 11px font + 4px
 * padding — rounded up for font variance across platforms; labels are locale-invariant.
 */
const ROW_LABEL_WIDTH = 32;

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
 * `auto repeat(n, …)`, so n columns carry n gaps).
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

// Exported for widgets that mirror the chart's non-compact grid geometry (e.g.
// deriving a cell height from a measured tile), so the metrics are stated once.
export const CELL_GAP = 4;
export const HEADER_HEIGHT = 16;
