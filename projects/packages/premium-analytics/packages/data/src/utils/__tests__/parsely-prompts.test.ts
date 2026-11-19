/**
 * Internal dependencies
 */
import { getParselySignupUrl } from '../parsely-prompts';

describe( 'getParselySignupUrl', () => {
	it( 'fills in the site and says the visit came from Jetpack', () => {
		expect( getParselySignupUrl( 'https://example.com/blog' ) ).toBe(
			'https://dash.parsely.com/self-serve?utm_source=jetpack&url=https%3A%2F%2Fexample.com%2Fblog'
		);
	} );

	it( 'still opens the signup page before the site address is known', () => {
		expect( getParselySignupUrl() ).toBe(
			'https://dash.parsely.com/self-serve?utm_source=jetpack'
		);
	} );
} );
