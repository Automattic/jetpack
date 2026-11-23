/**
 * Internal dependencies
 */
import { buildPageRows } from '../build-page-rows';

describe( 'buildPageRows', () => {
	it.each( [
		[ 'a path, opened on the site', '/2026/11/hello/', 'https://example.com/2026/11/hello/' ],
		[
			'a whole address, opened as it is',
			'https://example.com/about/',
			'https://example.com/about/',
		],
		[ 'a path that would leave the site, not linked', '//evil.example/x', undefined ],
	] )( 'reads %s', ( _, url, href ) => {
		const [ row ] = buildPageRows( [ { url, requests: 12 } ], 'https://example.com' );

		expect( row.value ).toBe( 12 );
		expect( row.action ).toEqual( href ? { kind: 'link', href } : undefined );
	} );

	it( 'leaves a path unlinked until the site address is known', () => {
		expect( buildPageRows( [ { url: '/about/', requests: 3 } ] )[ 0 ].action ).toBeUndefined();
	} );

	it( 'shows an encoded path the way it reads', () => {
		expect( buildPageRows( [ { url: '/caf%C3%A9/', requests: 1 } ] )[ 0 ].label ).toBe( '/café/' );
	} );
} );
