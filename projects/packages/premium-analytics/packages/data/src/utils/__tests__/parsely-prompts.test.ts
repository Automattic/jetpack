/**
 * Internal dependencies
 */
import { getParselySignupUrl } from '../parsely-prompts';

describe( 'getParselySignupUrl', () => {
	it( 'fills in the site and says the visit came from Jetpack', () => {
		expect( getParselySignupUrl( { url: 'https://example.com/blog', title: 'My Blog' } ) ).toBe(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&publisher_name=My+Blog&site_domain=example.com'
		);
	} );

	it.each( [
		[ 'the site address is not known yet', {} ],
		[ 'the site address does not parse', { url: 'not a url' } ],
	] )( 'still opens the signup page when %s', ( _case, site ) => {
		expect( getParselySignupUrl( site ) ).toBe(
			'https://dash.parsely.com/self-serve?utm_source=jetpack'
		);
	} );
} );
