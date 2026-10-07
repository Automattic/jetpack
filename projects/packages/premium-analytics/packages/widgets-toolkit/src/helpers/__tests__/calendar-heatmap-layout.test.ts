/**
 * Internal dependencies
 */
import { fitWeekColumns } from '../calendar-heatmap-layout';

describe( 'fitWeekColumns', () => {
	// The post traffic activity heatmap's design cells.
	const DESIGN_CELLS = { cellWidth: 64, cellGap: 4 };

	it( 'counts the whole columns the width can draw', () => {
		// floor( (1000 - 32) / (64 + 4) ) = floor( 14.23 ) = 14.
		expect( fitWeekColumns( { availWidth: 1000, ...DESIGN_CELLS } ) ).toBe( 14 );
	} );

	it( 'never returns fewer than the minimum for a usable width', () => {
		expect( fitWeekColumns( { availWidth: 200, ...DESIGN_CELLS, minColumns: 4 } ) ).toBe( 4 );
	} );

	it( 'holds the minimum when the width is unusable, so a page still renders', () => {
		expect( fitWeekColumns( { availWidth: 0, ...DESIGN_CELLS, minColumns: 4 } ) ).toBe( 4 );
	} );

	it( 'returns 0 with no minimum to fall back on', () => {
		expect( fitWeekColumns( { availWidth: Number.NaN, ...DESIGN_CELLS } ) ).toBe( 0 );
	} );

	// Every metric divides or subtracts, so an unguarded one leaves the caller with a
	// NaN or an absurd count to size a data request with — never a visible failure.
	it.each( [
		[ 'a zero cell width', { cellWidth: 0 } ],
		[ 'a NaN cell width', { cellWidth: Number.NaN } ],
		[ 'a NaN cell gap', { cellGap: Number.NaN } ],
		[ 'a cell gap cancelling the cell', { cellGap: -64 } ],
	] )( 'holds the minimum rather than compute from %s', ( _label, override ) => {
		expect(
			fitWeekColumns( { availWidth: 1000, ...DESIGN_CELLS, minColumns: 4, ...override } )
		).toBe( 4 );
	} );

	it( 'accepts a heatmap drawn with no gap', () => {
		// 0 is a real gap, so it cannot share the width's positive test.
		// floor( (1000 - 32) / 64 ) = floor( 15.13 ) = 15.
		expect( fitWeekColumns( { availWidth: 1000, cellWidth: 64, cellGap: 0 } ) ).toBe( 15 );
	} );

	// `minColumns` leaves through both branches, so an unnormalized one reaches the
	// caller as the page size it requests days with.
	it.each( [
		[ 'a usable width', 200, 2 ],
		[ 'an unusable width', 0, 0 ],
	] )( 'ignores a NaN minimum on %s', ( _label, availWidth, expected ) => {
		expect( fitWeekColumns( { availWidth, ...DESIGN_CELLS, minColumns: Number.NaN } ) ).toBe(
			expected
		);
	} );

	it( 'floors a fractional minimum rather than return a partial column', () => {
		expect( fitWeekColumns( { availWidth: 200, ...DESIGN_CELLS, minColumns: 4.5 } ) ).toBe( 4 );
	} );
} );
