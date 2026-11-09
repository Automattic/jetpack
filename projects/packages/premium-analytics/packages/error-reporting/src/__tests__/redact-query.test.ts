import { redactQuery } from '../redact-query';

const ALLOWLISTED_SEARCH =
	'?page=jetpack-premium-analytics-wp-admin&p=/&from=2026-01-01&to=2026-01-31&interval=day&preset=last-30&step=1&comp=1&compare_from=2025-12-01&compare_to=2025-12-31&compare_preset=previous&ds=traffic&section=posts&ref=dashboard&ref_section=traffic&post_url=https%3A%2F%2Fexample.com%2Fhello&post_id=7&author_id=3';

describe( 'redactQuery', () => {
	it( 'keeps the value and the encoding of every allowlisted parameter', () => {
		expect( redactQuery( ALLOWLISTED_SEARCH ) ).toBe( ALLOWLISTED_SEARCH.slice( 1 ) );
	} );

	it( 'masks the value of an unknown parameter', () => {
		expect( redactQuery( '?email=a@b.c' ) ).toBe( 'email=[redacted]' );
	} );

	it( 'keeps the parameters in their original order', () => {
		expect( redactQuery( '?secret=1&p=/posts&other=2' ) ).toBe(
			'secret=[redacted]&p=/posts&other=[redacted]'
		);
	} );

	it.each( [ '', '?' ] )( 'returns an empty string for the search string %j', search => {
		expect( redactQuery( search ) ).toBe( '' );
	} );

	it( 'drops a parameter whose name is unsafe and marks the removal once', () => {
		expect( redactQuery( '?john@example.com&a%3Db=1&p=/posts' ) ).toBe( '[unreportable]&p=/posts' );
	} );

	it( 'keeps only the first value of a repeated parameter', () => {
		expect( redactQuery( '?from=a&from=b' ) ).toBe( 'from=a' );
	} );
} );
