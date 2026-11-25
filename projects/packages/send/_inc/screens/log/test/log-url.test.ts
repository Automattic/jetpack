import { searchFromView, viewFromSearch } from '../log-url';

describe( 'viewFromSearch', () => {
	// The router parses values as JSON, so a typed order number or word comes back as another type.
	it.each( [
		[ 'an order number', 1048, '1048' ],
		[ 'true', true, 'true' ],
		[ 'null', null, 'null' ],
		[ 'a list', [ 1 ], '' ],
		[ 'an object', { a: 1 }, '' ],
		[ 'text', 'jordan', 'jordan' ],
	] )( 'reads %s as search text', ( _, value, text ) => {
		expect( viewFromSearch( { search: value } ).search ).toBe( text );
	} );

	it( 'reads comma lists as any-of filters, keeping only values the server takes', () => {
		expect(
			viewFromSearch( {
				status: 'failed, fallback,bounced,failed',
				origin: 'plugin:shop-orders-lite,core:password_reset,<script>',
				source: 'wp_mail,resend,cron',
			} ).filters
		).toEqual( [
			{ field: 'status', operator: 'isAny', value: [ 'failed', 'fallback' ] },
			{
				field: 'origin',
				operator: 'isAny',
				value: [ 'plugin:shop-orders-lite', 'core:password_reset' ],
			},
			{ field: 'source', operator: 'isAny', value: [ 'wp_mail', 'resend' ] },
		] );
	} );

	it( 'drops filters the router parsed as something other than text', () => {
		expect( viewFromSearch( { status: [ 'failed' ], source: 7 } ).filters ).toEqual( [] );
	} );
} );

describe( 'searchFromView', () => {
	it( 'writes lists comma-joined, the period, and clears every key it owns that has no value', () => {
		expect(
			searchFromView(
				{
					search: ' a ',
					filters: [
						{ field: 'status', operator: 'isAny', value: [ 'failed', 'fallback' ] },
						{ field: 'source', operator: 'isAny', value: undefined },
					],
				},
				{ range: 30 },
				'12'
			)
		).toEqual( {
			search: undefined,
			status: 'failed,fallback',
			origin: undefined,
			source: undefined,
			range: 30,
			start: undefined,
			end: undefined,
			days: undefined,
			from: undefined,
			entry: 12,
		} );
	} );

	it( 'round-trips what it reads', () => {
		const search = {
			search: '1048',
			status: 'failed',
			origin: 'theme:twentytwentyfive',
			start: '2026-10-01',
			end: '2026-10-19',
		};
		const view = viewFromSearch( search );
		expect( viewFromSearch( searchFromView( view, null, '' ) ) ).toEqual( view );
	} );
} );
