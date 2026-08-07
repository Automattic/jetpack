/**
 * Internal dependencies
 */
import { resolvePresetLabelMode } from '../date-range-layout';

// Roughly the Russian measurements from WOOA7S-1817: the locale with the widest
// gap between the two forms, so the middle tier is a real range and not a sliver.
const WIDTHS = { full: 694, abbreviated: 316 };

describe( 'resolvePresetLabelMode', () => {
	it( 'holds full labels until both measurements arrive', () => {
		expect( resolvePresetLabelMode( null, WIDTHS ) ).toBe( 'full' );
		expect( resolvePresetLabelMode( 200, null ) ).toBe( 'full' );
		expect( resolvePresetLabelMode( null, null ) ).toBe( 'full' );
	} );

	it( 'keeps full labels while they fit', () => {
		expect( resolvePresetLabelMode( 1200, WIDTHS ) ).toBe( 'full' );
		expect( resolvePresetLabelMode( WIDTHS.full, WIDTHS ) ).toBe( 'full' );
	} );

	it( 'abbreviates as soon as the full row no longer fits', () => {
		expect( resolvePresetLabelMode( WIDTHS.full - 1, WIDTHS ) ).toBe( 'abbreviated' );
		expect( resolvePresetLabelMode( 500, WIDTHS ) ).toBe( 'abbreviated' );
		expect( resolvePresetLabelMode( WIDTHS.abbreviated, WIDTHS ) ).toBe( 'abbreviated' );
	} );

	it( 'collapses to the select only once the abbreviated row overflows too', () => {
		expect( resolvePresetLabelMode( WIDTHS.abbreviated - 1, WIDTHS ) ).toBe( 'select' );
		expect( resolvePresetLabelMode( 0, WIDTHS ) ).toBe( 'select' );
	} );

	/*
	 * Each tier has to be reachable at some width. A rule that skipped the middle
	 * one would still satisfy the boundary assertions above while dropping
	 * straight from full labels to a select, which is the behavior this replaced.
	 */
	it( 'reaches every mode across the width range', () => {
		const seen = new Set(
			Array.from( { length: 1200 }, ( _, width ) => resolvePresetLabelMode( width, WIDTHS ) )
		);

		expect( seen ).toEqual( new Set( [ 'full', 'abbreviated', 'select' ] ) );
	} );

	/*
	 * Widths come from measuring live DOM, so they are not guaranteed ordered.
	 * The rule must stay monotonic regardless: never widen the labels as the
	 * container narrows.
	 */
	it( 'never upgrades the labels as the container shrinks', () => {
		const rank = { select: 0, abbreviated: 1, full: 2 } as const;
		const degenerate = { full: 300, abbreviated: 500 };

		for ( const widths of [ WIDTHS, degenerate ] ) {
			let previous = rank[ resolvePresetLabelMode( 1200, widths ) ];

			for ( let width = 1200; width >= 0; width -= 1 ) {
				const current = rank[ resolvePresetLabelMode( width, widths ) ];
				expect( current ).toBeLessThanOrEqual( previous );
				previous = current;
			}
		}
	} );
} );
