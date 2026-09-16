/**
 * Internal dependencies
 */
import { formatDailyViewCount, formatViewCount } from '../format-view-count';

describe( 'formatViewCount', () => {
	it( 'pluralises the unit', () => {
		expect( formatViewCount( 1 ) ).toBe( '1 view' );
		expect( formatViewCount( 2 ) ).toBe( '2 views' );
	} );
} );

describe( 'formatDailyViewCount', () => {
	it( 'pluralises the daily rate', () => {
		expect( formatDailyViewCount( 0 ) ).toBe( '0 views per day' );
		expect( formatDailyViewCount( 1 ) ).toBe( '1 view per day' );
		expect( formatDailyViewCount( 2 ) ).toBe( '2 views per day' );
	} );

	it( 'rounds a fractional rate before choosing the plural', () => {
		expect( formatDailyViewCount( 1.39 ) ).toBe( '1 view per day' );
		expect( formatDailyViewCount( 1.5 ) ).toBe( '2 views per day' );
	} );
} );
