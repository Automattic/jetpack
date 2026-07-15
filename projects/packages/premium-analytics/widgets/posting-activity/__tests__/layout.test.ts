/**
 * Internal dependencies
 */
import { computeCalendarHeatmapLayout, fitCalendarHeatmapColumns } from '../layout';
import type { CalendarHeatmapLayoutInput } from '../layout';

const COMPACT_ASPECT = 1;
const EXPANDED_ASPECT = 61 / 40;

// A compact-mode base matching the widget's tuning; per-test overrides tweak the
// tile size and mode.
const compactBase: CalendarHeatmapLayoutInput = {
	availWidth: 400,
	availHeight: 300,
	dataColumns: 52,
	rows: 7,
	aspectRatio: COMPACT_ASPECT,
	maxCellHeight: 35,
	minColumns: 4,
	gap: 2,
	headerHeight: 16,
	legendHeight: 24,
	rowLabelWidth: 32,
};

const expandedBase: CalendarHeatmapLayoutInput = {
	...compactBase,
	aspectRatio: EXPANDED_ASPECT,
	maxCellHeight: 48,
	gap: 4,
};

describe( 'computeCalendarHeatmapLayout', () => {
	it( 'a tall-narrow (2:1) tile hits the cell-height cap and preserves the 1:1 ratio', () => {
		const layout = computeCalendarHeatmapLayout( {
			...compactBase,
			availWidth: 200,
			availHeight: 600,
		} );

		// Height is ample, so the cell grows to the compact cap, not past it.
		expect( layout.cellHeight ).toBe( 35 );
		// Aspect ratio preserved: square cells.
		expect( layout.cellWidth ).toBeCloseTo( layout.cellHeight * COMPACT_ASPECT );
		// It is narrow, so it stays compact with only a few columns.
		expect( layout.columns ).toBe( 4 );
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

	it( 'a narrow-but-large tile triggers the 4-column shrink instead of scrolling', () => {
		const layout = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 250,
			availHeight: 600,
		} );

		// Falls back to the minimum column count.
		expect( layout.columns ).toBe( 4 );
		// The whole cell scaled down below the cap to make 4 columns fit.
		expect( layout.cellHeight ).toBeLessThan( expandedBase.maxCellHeight );
		// Aspect ratio is still preserved (never distorted).
		expect( layout.cellWidth / layout.cellHeight ).toBeCloseTo( EXPANDED_ASPECT );
		// The shrunk grid fills the available width rather than overflowing it.
		expect( layout.heatmapWidth ).toBeLessThanOrEqual( 250 + 0.01 );
		expect( layout.heatmapWidth ).toBeCloseTo( 250 );
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

		// The width fits 10 aspect-preserving columns; the rest are trimmed.
		expect( layout.columns ).toBe( 10 );
		expect( layout.columns ).toBeLessThan( 52 );
	} );

	it( 'preserves the aspect ratio and reports coherent total dimensions', () => {
		const layout = computeCalendarHeatmapLayout( {
			...expandedBase,
			availWidth: 900,
			availHeight: 320,
		} );

		expect( layout.cellWidth / layout.cellHeight ).toBeCloseTo( EXPANDED_ASPECT );
		// Totals follow the documented formulas exactly.
		const expectedWidth =
			expandedBase.rowLabelWidth +
			layout.columns * layout.cellWidth +
			( layout.columns - 1 ) * expandedBase.gap;
		const expectedHeight =
			expandedBase.headerHeight +
			expandedBase.legendHeight +
			( expandedBase.rows ?? 7 ) * layout.cellHeight +
			( ( expandedBase.rows ?? 7 ) - 1 ) * expandedBase.gap;
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

	it( 'defaults rows to 7 and minColumns to 4 when omitted', () => {
		const layout = computeCalendarHeatmapLayout( {
			availWidth: 200,
			availHeight: 600,
			dataColumns: 52,
			aspectRatio: COMPACT_ASPECT,
			maxCellHeight: 35,
			gap: 2,
			headerHeight: 16,
			legendHeight: 24,
			rowLabelWidth: 32,
		} );

		// 7 rows at the 35px cap plus overhead and inter-row gaps.
		expect( layout.heatmapHeight ).toBeCloseTo( 16 + 24 + 7 * 35 + 6 * 2 );
		expect( layout.columns ).toBe( 4 );
	} );
} );

describe( 'fitCalendarHeatmapColumns', () => {
	const base = {
		cellWidth: 11,
		gap: 2,
		rowLabelWidth: 32,
		dataColumns: 52,
		minColumns: 4,
	};

	it( 'fits as many fixed cells as the width allows, never overflowing', () => {
		const columns = fitCalendarHeatmapColumns( { ...base, availWidth: 200 } );

		// floor( (200 - 32) / (11 + 2) ) = floor( 12.9 ) = 12.
		expect( columns ).toBe( 12 );
		// The trimmed row of cells stays within the available width.
		expect( 32 + columns * 11 + columns * 2 ).toBeLessThanOrEqual( 200 );
	} );

	it( 'never returns more columns than weeks in range', () => {
		expect( fitCalendarHeatmapColumns( { ...base, availWidth: 2000, dataColumns: 20 } ) ).toBe(
			20
		);
	} );

	it( 'keeps the column minimum on a narrow tile', () => {
		expect( fitCalendarHeatmapColumns( { ...base, availWidth: 60 } ) ).toBe( 4 );
	} );

	it( 'shows all available when the range has fewer than the minimum', () => {
		expect( fitCalendarHeatmapColumns( { ...base, availWidth: 60, dataColumns: 2 } ) ).toBe( 2 );
	} );

	it.each( [
		[ 'zero width', { availWidth: 0 } ],
		[ 'zero data columns', { availWidth: 500, dataColumns: 0 } ],
		[ 'NaN width', { availWidth: Number.NaN } ],
	] )( 'returns 0 for %s', ( _label, override ) => {
		expect( fitCalendarHeatmapColumns( { ...base, availWidth: 500, ...override } ) ).toBe( 0 );
	} );
} );
