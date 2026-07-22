/**
 * Internal dependencies
 */
import { summaryCount } from '../summary-count';

describe( 'summaryCount', () => {
	it( 'reads a numeric field', () => {
		expect( summaryCount( { views: 42 }, 'views' ) ).toBe( 42 );
	} );

	it( 'coerces a numeric string, as WPCOM sends for some fields', () => {
		expect( summaryCount( { views: '42' }, 'views' ) ).toBe( 42 );
	} );

	it( 'returns undefined for a missing key', () => {
		expect( summaryCount( { views: 42 }, 'visitors' ) ).toBeUndefined();
	} );

	it( 'returns undefined for an undefined summary', () => {
		expect( summaryCount( undefined, 'views' ) ).toBeUndefined();
	} );

	it( 'returns undefined for a non-numeric string', () => {
		expect( summaryCount( { views: 'lots' }, 'views' ) ).toBeUndefined();
	} );

	it( 'returns undefined for non-finite values', () => {
		expect( summaryCount( { views: Infinity }, 'views' ) ).toBeUndefined();
		expect( summaryCount( { views: NaN }, 'views' ) ).toBeUndefined();
	} );

	it( 'returns undefined for values that are neither number nor string', () => {
		expect( summaryCount( { views: null }, 'views' ) ).toBeUndefined();
		expect( summaryCount( { views: { count: 1 } }, 'views' ) ).toBeUndefined();
	} );

	it( 'preserves zero, which is a real count rather than a missing one', () => {
		expect( summaryCount( { views: 0 }, 'views' ) ).toBe( 0 );
	} );
} );
