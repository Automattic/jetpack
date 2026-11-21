import {
	describeFilter,
	describeNarrowing,
	describeScope,
	isNarrowed,
	isPageSelected,
	normalizeTypedCount,
} from '../_inc/subscribers/lib/bulk-remove-scope';

describe( 'bulk remove scope helpers', () => {
	it( 'describes a filter the way its chip reads', () => {
		expect( describeFilter( 'paid' ) ).toBe( 'Subscription type is Paid' );
		expect( describeFilter( 'blocked_subscriber' ) ).toBe(
			'Email subscription is Not sending (any reason)'
		);
	} );

	it( 'skips `all` and unknown filters', () => {
		expect( describeFilter( 'all' ) ).toBeNull();
		expect( describeFilter( 'something_else' ) ).toBeNull();
	} );

	it( 'lists the search first, then each filter', () => {
		expect( describeScope( [ 'free', 'unconfirmed_subscriber' ], '  gmail ' ) ).toEqual( [
			'Name or email contains “gmail”',
			'Subscription type is Free',
			'Email subscription is Not confirmed',
		] );
	} );

	it( 'returns no lines for the whole list', () => {
		expect( describeScope( [ 'all' ], '' ) ).toEqual( [] );
	} );

	it.each( [
		[ [ 'paid' ], '', 'filter' ],
		[ [ 'all' ], 'bob', 'search' ],
		[ [ 'paid' ], 'bob', 'search and filter' ],
	] )(
		'warns about the %j filters and %j search as a whole sentence',
		( filters, search, tail ) => {
			expect( describeNarrowing( filters, search, 1200 ) ).toBe(
				`This removes everyone on your list, not only the 1,200 that match your ${ tail }.`
			);
		}
	);

	it( 'treats `all` and a blank search as the whole list', () => {
		expect( isNarrowed( [ 'all' ], '' ) ).toBe( false );
		expect( isNarrowed( [], '   ' ) ).toBe( false );
		expect( isNarrowed( [ 'paid' ], '' ) ).toBe( true );
		expect( isNarrowed( [ 'all' ], 'x' ) ).toBe( true );
	} );

	it( 'counts the page as selected only when every row on it is', () => {
		expect( isPageSelected( [ 'a', 'b' ], [ 'b', 'a', 'x' ] ) ).toBe( true );
		expect( isPageSelected( [ 'a', 'b', 'c' ], [ 'a', 'b' ] ) ).toBe( false );
		expect( isPageSelected( [], [ 'a' ] ) ).toBe( false );
	} );

	it( 'drops thousands separators from the typed count', () => {
		expect( normalizeTypedCount( '15,000' ) ).toBe( '15000' );
		expect( normalizeTypedCount( '15.000' ) ).toBe( '15000' );
		expect( normalizeTypedCount( ' 15 000 ' ) ).toBe( '15000' );
		expect( normalizeTypedCount( '15000' ) ).toBe( '15000' );
	} );
} );
