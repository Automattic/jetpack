/**
 * Internal dependencies
 */
import { formatDisplayLabel } from '../format-display-label';

describe( 'formatDisplayLabel', () => {
	it( 'prefers a mapped label, matching case-insensitively', () => {
		expect( formatDisplayLabel( 'Desktop', { desktop: 'Desktop screen' } ) ).toBe(
			'Desktop screen'
		);
	} );

	it( 'title-cases an unmapped key', () => {
		expect( formatDisplayLabel( 'vivaldi', { chrome: 'Chrome' } ) ).toBe( 'Vivaldi' );
		expect( formatDisplayLabel( 'chrome' ) ).toBe( 'Chrome' );
	} );

	// The map is a plain object, so an inherited member would otherwise be
	// returned where a string is expected.
	it.each( [ 'toString', 'constructor', 'hasOwnProperty' ] )(
		'does not return the inherited %s member',
		key => {
			expect( formatDisplayLabel( key, { chrome: 'Chrome' } ) ).toBe(
				key.charAt( 0 ).toUpperCase() + key.slice( 1 )
			);
		}
	);
} );
