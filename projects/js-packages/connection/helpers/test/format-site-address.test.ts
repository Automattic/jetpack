import { formatSiteAddress, getSiteUrl, isIpAddress } from '../format-site-address';

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

describe( 'isIpAddress', () => {
	it.each( [
		[ '203.0.113.5', true ],
		[ '203.0.113.5:8080/blog', true ],
		[ '[2001:db8::1]', true ],
		[ '[2001:db8::1]:8443/wp', true ],
		[ 'example.com', false ],
		[ '203.0.113.5.example.com', false ],
		[ 'example.com/203.0.113.5', false ],
		[ '', false ],
	] )( '%s is an IP address: %s', ( address, expected ) => {
		expect( isIpAddress( address ) ).toBe( expected );
	} );
} );

describe( 'getSiteUrl', () => {
	it.each( [
		[ 'example.com/', 'http://example.com/' ],
		[ 'example.com/blog/', 'http://example.com/blog' ],
		[ 'localhost:8888/', 'http://localhost:8888/' ],
		[ '', null ],
		[ 'exa mple.com', null ],
	] )( '%s links to %s', ( address, url ) => {
		expect( getSiteUrl( address ) ).toBe( url );
	} );
} );
