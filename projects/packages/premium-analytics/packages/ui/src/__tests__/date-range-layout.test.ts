/**
 * Internal dependencies
 */
import { resolvePresetLabelMode } from '../date-range-layout';

// Roughly the Russian measurement from WOOA7S-1817: the locale whose full row
// is widest, so the boundary sits far from the English one.
const FULL_ROW_WIDTH = 694;

describe( 'resolvePresetLabelMode', () => {
	it( 'holds full labels until the measurement arrives', () => {
		expect( resolvePresetLabelMode( null, FULL_ROW_WIDTH ) ).toBe( 'full' );
		expect( resolvePresetLabelMode( 200, null ) ).toBe( 'full' );
		expect( resolvePresetLabelMode( null, null ) ).toBe( 'full' );
	} );

	it( 'keeps full labels while they fit', () => {
		expect( resolvePresetLabelMode( 1200, FULL_ROW_WIDTH ) ).toBe( 'full' );
		expect( resolvePresetLabelMode( FULL_ROW_WIDTH, FULL_ROW_WIDTH ) ).toBe( 'full' );
	} );

	/*
	 * Abbreviated is the last step: a row too narrow even for it keeps the pills
	 * rather than collapsing the surface into a select.
	 */
	it( 'abbreviates as soon as the full row no longer fits, and stays there', () => {
		expect( resolvePresetLabelMode( FULL_ROW_WIDTH - 1, FULL_ROW_WIDTH ) ).toBe( 'abbreviated' );
		expect( resolvePresetLabelMode( 200, FULL_ROW_WIDTH ) ).toBe( 'abbreviated' );
		expect( resolvePresetLabelMode( 0, FULL_ROW_WIDTH ) ).toBe( 'abbreviated' );
	} );

	/*
	 * Widths come from measuring live DOM, so the rule has to stay monotonic:
	 * never widen the labels as the container narrows.
	 */
	it( 'never upgrades the labels as the container shrinks', () => {
		const rank = { abbreviated: 0, full: 1 } as const;
		let previous = rank[ resolvePresetLabelMode( 1200, FULL_ROW_WIDTH ) ];

		for ( let width = 1200; width >= 0; width -= 1 ) {
			const current = rank[ resolvePresetLabelMode( width, FULL_ROW_WIDTH ) ];
			expect( current ).toBeLessThanOrEqual( previous );
			previous = current;
		}
	} );
} );
