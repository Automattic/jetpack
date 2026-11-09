import { redactQuery } from '../redact-query';

const ALLOWLISTED_SEARCH =
	'?page=jetpack-premium-analytics-wp-admin&p=/&from=2026-01-01&to=2026-01-31&interval=day&preset=last-30&step=1&comp=1&compare_from=2025-12-01&compare_to=2025-12-31&compare_preset=previous&ds=traffic&section=posts&ref=dashboard&ref_section=traffic&post_url=https%3A%2F%2Fexample.com%2Fhello&post_id=7&author_id=3';

describe( 'redactQuery', () => {
	it( 'keeps the value of every allowlisted parameter', () => {
		expect( redactQuery( ALLOWLISTED_SEARCH ) ).toEqual( {
			page: 'jetpack-premium-analytics-wp-admin',
			p: '/',
			from: '2026-01-01',
			to: '2026-01-31',
			interval: 'day',
			preset: 'last-30',
			step: '1',
			comp: '1',
			compare_from: '2025-12-01',
			compare_to: '2025-12-31',
			compare_preset: 'previous',
			ds: 'traffic',
			section: 'posts',
			ref: 'dashboard',
			ref_section: 'traffic',
			post_url: 'https://example.com/hello',
			post_id: '7',
			author_id: '3',
		} );
	} );

	it( 'replaces the value of an unknown parameter with [redacted]', () => {
		expect( redactQuery( '?email=a@b.c' ) ).toEqual( { email: '[redacted]' } );
	} );

	it.each( [ '', '?' ] )( 'returns an empty object for the search string %j', search => {
		expect( redactQuery( search ) ).toEqual( {} );
	} );

	it( 'keeps only the first value of a repeated parameter', () => {
		expect( redactQuery( '?from=a&from=b' ) ).toEqual( { from: 'a' } );
	} );
} );
