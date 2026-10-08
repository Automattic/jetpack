import isAllowedEmbedUrl, { getAllowedEmbedUrl } from '../is-allowed-embed-url';

describe( 'isAllowedEmbedUrl', () => {
	const hosts = [ 'calendly.com' ];

	test.each( [
		'https://calendly.com/username',
		'https://www.calendly.com/username',
		'https://team.calendly.com/username?foo=bar',
		'HTTPS://Calendly.com/username',
	] )( 'accepts allowed HTTPS host: %s', url => {
		expect( isAllowedEmbedUrl( url, hosts ) ).toBe( true );
	} );

	test.each( [
		'javascript:void(0)',
		'JavaScript:void(0)',
		'  javascript:void(0)',
		'data:text/html,<p>hello</p>',
		'http://calendly.com/username', // not HTTPS
		'https://example.org/username', // wrong host
		'https://calendly.com.example.org/username', // longer host with the same prefix
		'https://notcalendly.com/username', // substring, not subdomain
		'calendly.com/username', // not absolute
		'',
		undefined,
		null,
		42,
	] )( 'rejects a value that is not an allowed HTTPS url: %s', url => {
		expect( isAllowedEmbedUrl( url, hosts ) ).toBe( false );
	} );

	test( 'supports RegExp host matchers', () => {
		expect( isAllowedEmbedUrl( 'https://docs.google.com/a', [ /(^|\.)google\.com$/ ] ) ).toBe(
			true
		);
		expect( isAllowedEmbedUrl( 'https://notgooglexcom/a', [ /(^|\.)google\.com$/ ] ) ).toBe(
			false
		);
	} );

	test( 'rejects everything when no hosts are allowed', () => {
		expect( isAllowedEmbedUrl( 'https://calendly.com/username' ) ).toBe( false );
	} );
} );

describe( 'getAllowedEmbedUrl', () => {
	const hosts = [ 'calendly.com' ];

	test( 'returns an empty string for a rejected url', () => {
		expect( getAllowedEmbedUrl( 'javascript:void(0)', hosts ) ).toBe( '' );
		expect( getAllowedEmbedUrl( 'https://other.example.com/username', hosts ) ).toBe( '' );
	} );

	test( 'percent-encodes a quote in the path', () => {
		expect( getAllowedEmbedUrl( 'https://calendly.com/x"y="z', hosts ) ).toBe(
			'https://calendly.com/x%22y=%22z'
		);
	} );

	test( 'returns the normalized url for an allowed host', () => {
		expect( getAllowedEmbedUrl( 'HTTPS://Calendly.com/username', hosts ) ).toBe(
			'https://calendly.com/username'
		);
	} );
} );
