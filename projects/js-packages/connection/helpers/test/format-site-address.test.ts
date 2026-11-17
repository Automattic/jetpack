import { formatSiteAddress } from '../format-site-address';

describe( 'formatSiteAddress', () => {
	it.each( [
		[ 'example.com/', 'example.com' ],
		[ 'https://example.com/', 'example.com' ],
		[ 'HTTP://example.com', 'example.com' ],
		[ 'https://example.com/blog/', 'example.com/blog' ],
		[ 'https://example.com:8080', 'example.com:8080' ],
		[ 'example.com//', 'example.com' ],
		[ 'https://example.com//blog/', 'example.com//blog' ],
		[ '/', '' ],
		[ undefined, '' ],
	] )( '%s reads as %s', ( url, address ) => {
		expect( formatSiteAddress( url ) ).toBe( address );
	} );
} );
