import { describeErrorSet, suggestion } from './describe-critical-css-recommendations';
import type { ErrorSet } from './critical-css-errors';

const MEMBERS = 'https://example.com/members/';
const INTERNAL = 'https://example.com/internal/';

function httpErrorSet( pages: Record< string, Record< string, unknown > > ): ErrorSet {
	const urls = Object.keys( pages );

	return {
		type: 'HttpError',
		firstMeta: pages[ urls[ 0 ] ],
		byUrl: Object.fromEntries(
			urls.map( url => [
				url,
				{ url, message: 'HTTP 403', type: 'HttpError', meta: pages[ url ] },
			] )
		),
	} as ErrorSet;
}

describe( 'HttpError descriptions', () => {
	it( 'names the login gate when the site answered with it', () => {
		const set = httpErrorSet( { [ MEMBERS ]: { code: 403, login_required: true } } );

		expect( describeErrorSet( set ) ).toContain( 'only shown to logged-in visitors' );
		expect( suggestion( set ).paragraph ).toContain( 'logged-out visitor' );
	} );

	it( 'describes any other 403 as an HTTP error', () => {
		const set = httpErrorSet( { [ MEMBERS ]: { code: 403 } } );

		expect( describeErrorSet( set ) ).toContain( 'HTTP error' );
		expect( suggestion( set ).paragraph ).not.toContain( 'logged-out visitor' );
	} );

	it( 'gives no login advice when the set mixes a login gate with another 403', () => {
		const set = httpErrorSet( {
			[ MEMBERS ]: { code: 403, login_required: true },
			[ INTERNAL ]: { code: 403 },
		} );

		expect( describeErrorSet( set ) ).toContain( 'HTTP error' );
		expect( suggestion( set ).paragraph ).not.toContain( 'logged-out visitor' );
	} );
} );
