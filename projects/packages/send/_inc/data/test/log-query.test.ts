import { cleanSearch, debugQueryArgs, logQueryArgs, viewToQuery } from '../log-query';
import type { View } from '@wordpress/dataviews';

const view = ( overrides: Partial< View > = {} ): View =>
	( { type: 'table', page: 2, perPage: 20, ...overrides } ) as View;

describe( 'cleanSearch', () => {
	it.each< [ string, unknown, string ] >( [
		[ 'one character', 'a', '' ],
		[ 'spaces around two', '  ab ', 'ab' ],
		[ 'an order number the router parsed', 1048, '1048' ],
		[ 'control characters', 'jo\u0000rdan\n', 'jordan' ],
		[ 'a percent sign, untouched', '50%', '50%' ],
		[ 'something that isn’t text', [ 'a' ], '' ],
	] )( 'handles %s', ( _, value, expected ) => {
		expect( cleanSearch( value ) ).toBe( expected );
	} );

	it( 'cuts at 100 characters without splitting an emoji', () => {
		const text = `${ 'a'.repeat( 99 ) }😀😀`;
		expect( Array.from( cleanSearch( text ) ) ).toHaveLength( 100 );
		expect( cleanSearch( text ).endsWith( '😀' ) ).toBe( true );
	} );
} );

describe( 'viewToQuery and logQueryArgs', () => {
	it( 'reads Status, Source and Type as lists, dropping values the server would refuse', () => {
		const query = viewToQuery(
			view( {
				search: 'jordan',
				filters: [
					{ field: 'status', operator: 'isAny', value: [ 'failed', 'fallback', 'bogus' ] },
					{ field: 'origin', operator: 'isAny', value: [ 'plugin:shop', 'plugin:shop' ] },
					{ field: 'source', operator: 'is', value: 'resend' },
				],
			} ),
			{ range: 7 }
		);
		expect( query ).toEqual( {
			page: 2,
			per_page: 20,
			search: 'jordan',
			status: [ 'failed', 'fallback' ],
			origin: [ 'plugin:shop' ],
			source: [ 'resend' ],
			period: { range: 7 },
		} );
		expect( logQueryArgs( query ) ).toEqual( {
			page: 2,
			per_page: 20,
			search: 'jordan',
			status: [ 'failed', 'fallback' ],
			origin: [ 'plugin:shop' ],
			source: [ 'resend' ],
			range: 7,
		} );
	} );

	it( 'sends nothing for empty filters, a short search or any date', () => {
		const query = viewToQuery(
			view( { search: 'j', filters: [ { field: 'status', operator: 'isAny', value: [] } ] } ),
			null
		);
		expect( logQueryArgs( query ) ).toEqual( { page: 2, per_page: 20 } );
	} );

	it( 'sends custom days as start and end', () => {
		expect(
			logQueryArgs( {
				page: 1,
				per_page: 20,
				period: { start: '2026-10-01', end: '2026-10-19' },
			} )
		).toEqual( { page: 1, per_page: 20, start: '2026-10-01', end: '2026-10-19' } );
	} );
} );

describe( 'debugQueryArgs', () => {
	it( 'sends only the filters that are set', () => {
		expect(
			debugQueryArgs( { page: 1, per_page: 50, search: ' x ', level: [ 'error' ], area: [] } )
		).toEqual( { page: 1, per_page: 50, level: [ 'error' ] } );
		expect( debugQueryArgs( { email: '12' } ) ).toEqual( { email: '12' } );
	} );
} );
