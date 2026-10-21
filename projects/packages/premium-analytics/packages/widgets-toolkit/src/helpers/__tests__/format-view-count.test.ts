/**
 * Internal dependencies
 */
import { formatViewCount } from '../format-view-count';

describe( 'formatViewCount', () => {
	it( 'pluralises the unit', () => {
		expect( formatViewCount( 1 ) ).toBe( '1 view' );
		expect( formatViewCount( 2 ) ).toBe( '2 views' );
	} );
} );
