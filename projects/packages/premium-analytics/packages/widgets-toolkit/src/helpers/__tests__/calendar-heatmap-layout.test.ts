/**
 * Internal dependencies
 */
import {
	compactCalendarHeatmapCapacity,
	computeCalendarHeatmapLayout,
} from '../calendar-heatmap-layout';
import type { CalendarHeatmapLayoutInput } from '../calendar-heatmap-layout';

const COMPACT_ASPECT = 1;
const EXPANDED_ASPECT = 61 / 40;

// Mirror the module-internal geometry constants so the total-dimension
// assertions stay coherent with calendar-heatmap-layout.ts.
const ROW_LABEL_WIDTH = 32;
const CELL_GAP = 4;
const HEADER_HEIGHT = 16;
const LEGEND_HEIGHT = 44;
const ROWS = 7;

// Only the fields the widget actually passes; rows and minColumns fall to their
// defaults (7 and 6), matching how render.tsx calls this.
const compactBase: CalendarHeatmapLayoutInput = {
	availWidth: 400,
	availHeight: 300,
	dataColumns: 52,
	aspectRatio: COMPACT_ASPECT,
	maxCellHeight: 35,
};

const expandedBase: CalendarHeatmapLayoutInput = {
	...compactBase,
	aspectRatio: EXPANDED_ASPECT,
	maxCellHeight: 48,
};

describe( 'computeCalendarHeatmapLayout unbounded inputs', () => {
	it( 'without dataColumns, the width alone decides the column count', () => {
		const bounded = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 3000,
			availHeight: 300,
		} );
		const unbounded = computeCalendarHeatmapLayout( {
			availWidth: 3000,
			availHeight: 300,
			aspectRatio: EXPANDED_ASPECT,
			maxCellHeight: expandedBase.maxCellHeight,
		} );

		// The bounded call stops at the 52 weeks in range; the unbounded one keeps
		// going, so a short range can be padded out to fill the tile.
		expect( bounded.columns ).toBe( 52 );
		expect( unbounded.columns ).toBeGreaterThan( bounded.columns );
		expect( unbounded.cellHeight ).toBe( bounded.cellHeight );
	} );

	it( 'without maxCellHeight, the cells grow to fill the height', () => {
		const capped = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 3000,
			availHeight: 600,
		} );
		const uncapped = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 3000,
			availHeight: 600,
			maxCellHeight: undefined,
		} );

		expect( capped.cellHeight ).toBe( expandedBase.maxCellHeight );
		expect( uncapped.cellHeight ).toBeGreaterThan( capped.cellHeight );
		// The ratio sets the cell before the leftover width is shared out, so the
		// grown cell is that shape or a little wider — never narrower.
		expect( uncapped.cellWidth ).toBeGreaterThanOrEqual(
			uncapped.cellHeight * EXPANDED_ASPECT - 0.01
		);
		// Both axes account for the whole tile.
		expect( uncapped.heatmapHeight ).toBeCloseTo( 600 );
		expect( uncapped.heatmapWidth ).toBeCloseTo( 3000 );
	} );
} );

describe( 'computeCalendarHeatmapLayout', () => {
	it( 'a tall-narrow tile hits the cell-height cap and shares out the leftover width', () => {
		const layout = computeCalendarHeatmapLayout( {
			...compactBase,
			availWidth: 280,
			availHeight: 600,
		} );

		// Height is ample, so the cell grows to the cap, not past it.
		expect( layout.cellHeight ).toBe( 35 );
		// It is narrow, so it keeps only the minimum column count — and those columns
		// take the width left over, which is why the cell ends up wider than the 1:1
		// ratio asked for. The ratio sizes the cell; the tile decides the rest.
		expect( layout.columns ).toBe( 6 );
		expect( layout.cellWidth ).toBeGreaterThan( layout.cellHeight * COMPACT_ASPECT );
		expect( layout.heatmapWidth ).toBeCloseTo( 280 );
	} );

	it( 'a wide-short (1:4) tile is height-limited yet fits many columns', () => {
		const layout = computeCalendarHeatmapLayout( {
			...compactBase,
			availWidth: 1200,
			availHeight: 120,
		} );

		// Short height keeps the cell well under the cap.
		expect( layout.cellHeight ).toBeLessThan( compactBase.maxCellHeight );
		expect( layout.cellHeight ).toBeGreaterThan( 0 );
		// Wide enough to show every week column in range.
		expect( layout.columns ).toBe( 52 );
	} );

	it( 'a narrow tile narrows the cells rather than shortening them', () => {
		const layout = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 250,
			availHeight: 600,
		} );

		// Falls back to the minimum column count.
		expect( layout.columns ).toBe( 6 );
		// The rows still take the height (here, up to this mode's cap): deriving the
		// cell from the width instead left the lower two thirds of a tall widget
		// empty.
		expect( layout.cellHeight ).toBe( expandedBase.maxCellHeight );
		// The cells give up width instead — narrower than the ratio asks for, so six
		// columns fit without overflowing or scrolling.
		expect( layout.cellWidth ).toBeLessThan( layout.cellHeight * EXPANDED_ASPECT );
		expect( layout.heatmapWidth ).toBeLessThanOrEqual( 250 + 0.01 );
		expect( layout.heatmapWidth ).toBeCloseTo( 250 );
	} );

	it( 'fills the height of a narrow tile taller than any cap', () => {
		const layout = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 250,
			availHeight: 900,
			maxCellHeight: undefined,
			legendHeight: 0,
		} );

		// The case a one-column-wide widget dragged very tall used to get wrong: six
		// tall, narrow cells filling the tile, not a small grid with a band of empty
		// space under it.
		expect( layout.columns ).toBe( 6 );
		expect( layout.heatmapHeight ).toBeCloseTo( 900 );
		expect( layout.heatmapWidth ).toBeCloseTo( 250 );
		expect( layout.cellHeight ).toBeGreaterThan( layout.cellWidth );
	} );

	it( 'shows every column when the range has fewer than the minimum', () => {
		const layout = computeCalendarHeatmapLayout( {
			...compactBase,
			availWidth: 800,
			availHeight: 300,
			dataColumns: 3,
		} );

		// min(minColumns, dataColumns) === 3, and the wide tile fits all of them.
		expect( layout.columns ).toBe( 3 );
	} );

	it( 'trims to fewer columns when the weeks in range exceed the width', () => {
		const layout = computeCalendarHeatmapLayout( {
			...compactBase,
			availWidth: 420,
			availHeight: 300,
			dataColumns: 52,
		} );

		// The width fits 11 aspect-preserving columns; the rest are trimmed.
		expect( layout.columns ).toBe( 11 );
		expect( layout.columns ).toBeLessThan( 52 );
	} );

	it( 'fills the tile width and reports coherent total dimensions', () => {
		const layout = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 900,
			availHeight: 320,
		} );

		// The cells share out the width an integer column count leaves over, so they
		// end up at the ratio or slightly wider, and the grid reaches the tile's edge.
		expect( layout.cellWidth / layout.cellHeight ).toBeGreaterThanOrEqual( EXPANDED_ASPECT );
		expect( layout.heatmapWidth ).toBeCloseTo( 900 );
		// Totals follow the documented formulas exactly.
		const expectedWidth =
			ROW_LABEL_WIDTH + layout.columns * layout.cellWidth + ( layout.columns - 1 ) * CELL_GAP;
		const expectedHeight =
			HEADER_HEIGHT + LEGEND_HEIGHT + ROWS * layout.cellHeight + ( ROWS - 1 ) * CELL_GAP;
		expect( layout.heatmapWidth ).toBeCloseTo( expectedWidth );
		expect( layout.heatmapHeight ).toBeCloseTo( expectedHeight );
	} );

	it.each( [
		[ 'zero width', { availWidth: 0 } ],
		[ 'zero height', { availHeight: 0 } ],
		[ 'zero data columns', { dataColumns: 0 } ],
		[ 'negative width', { availWidth: -100 } ],
		[ 'NaN height', { availHeight: Number.NaN } ],
		[ 'infinite width', { availWidth: Number.POSITIVE_INFINITY } ],
	] )( 'returns a zero layout for %s', ( _label, override ) => {
		const layout = computeCalendarHeatmapLayout( { ...compactBase, ...override } );
		expect( layout ).toEqual( {
			columns: 0,
			cellWidth: 0,
			cellHeight: 0,
			heatmapWidth: 0,
			heatmapHeight: 0,
		} );
	} );

	it( 'defaults rows to 7 when omitted', () => {
		const layout = computeCalendarHeatmapLayout( {
			availWidth: 400,
			availHeight: 600,
			dataColumns: 52,
			aspectRatio: COMPACT_ASPECT,
			maxCellHeight: 35,
		} );

		// 7 rows at the 35px cap plus overhead and inter-row gaps.
		expect( layout.heatmapHeight ).toBeCloseTo(
			HEADER_HEIGHT + LEGEND_HEIGHT + ROWS * 35 + ( ROWS - 1 ) * CELL_GAP
		);
	} );

	it( 'defaults minColumns to 6 when omitted', () => {
		// At 200px only 4 aspect-preserving cells fit; a default minimum of 6 forces
		// the shrink, so the column count lands on 6 rather than 4.
		const layout = computeCalendarHeatmapLayout( {
			availWidth: 200,
			availHeight: 600,
			dataColumns: 52,
			aspectRatio: COMPACT_ASPECT,
			maxCellHeight: 35,
		} );

		expect( layout.columns ).toBe( 6 );
	} );
} );

describe( 'compactCalendarHeatmapCapacity', () => {
	it( 'reports the columns a width can hold, ignoring the range', () => {
		// floor( (1024 - 32) / (11 + 2) ) = floor( 76.3 ) = 76.
		expect( compactCalendarHeatmapCapacity( 1024 ) ).toBe( 76 );
	} );

	it.each( [
		[ 'a width narrower than the row labels', 20 ],
		[ 'zero width', 0 ],
		[ 'NaN width', Number.NaN ],
	] )( 'returns 0 for %s', ( _label, width ) => {
		expect( compactCalendarHeatmapCapacity( width ) ).toBe( 0 );
	} );
} );

describe( 'computeCalendarHeatmapLayout legend allowance', () => {
	// Available content height in a two-row Insights tile.
	const TILE_CONTENT_HEIGHT = 326;

	const trafficViewsBase: CalendarHeatmapLayoutInput = {
		availWidth: 1183,
		availHeight: TILE_CONTENT_HEIGHT,
		dataColumns: 52,
		aspectRatio: EXPANDED_ASPECT,
		maxCellHeight: 40,
	};

	it( 'defaults to reserving the legend, matching posting activity', () => {
		const withDefault = computeCalendarHeatmapLayout( trafficViewsBase );
		const withExplicit = computeCalendarHeatmapLayout( {
			...trafficViewsBase,
			legendHeight: LEGEND_HEIGHT,
		} );

		expect( withDefault ).toEqual( withExplicit );
	} );

	it( 'reaches the design cell size only once the legend allowance is dropped', () => {
		expect( computeCalendarHeatmapLayout( trafficViewsBase ).cellHeight ).toBeCloseTo( 34.57, 1 );

		const noLegend = computeCalendarHeatmapLayout( { ...trafficViewsBase, legendHeight: 0 } );
		expect( noLegend.cellHeight ).toBe( 40 );
		// At least the design's 61px: the cells also take the width left over by an
		// integer column count.
		expect( noLegend.cellWidth ).toBeGreaterThanOrEqual( 61 );
	} );

	it( 'leaves no legend gap under the grid when the allowance is zero', () => {
		const { heatmapHeight, cellHeight } = computeCalendarHeatmapLayout( {
			...trafficViewsBase,
			legendHeight: 0,
		} );

		expect( heatmapHeight ).toBe( HEADER_HEIGHT + ROWS * cellHeight + ( ROWS - 1 ) * CELL_GAP );
	} );
} );
