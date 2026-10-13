import { describeErrorSet, suggestion } from './describe-critical-css-recommendations';
import { groupErrorsByFrequency, groupKey } from './critical-css-errors';
import type { ErrorSet } from './critical-css-errors';
import type { CriticalCssErrorDetails } from './stores/critical-css-state-types';

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

function errorAt( url: string, meta: Record< string, unknown > ): CriticalCssErrorDetails {
	return { url, message: 'HTTP 403', type: 'HttpError', meta } as CriticalCssErrorDetails;
}

describe( 'grouping login-gated pages', () => {
	it( 'keeps a login-gated page out of an unrelated 403 group', () => {
		const loginGated = errorAt( 'https://example.com/members/', {
			code: 403,
			login_required: true,
		} );
		const firewalled = errorAt( 'https://example.com/internal/', { code: 403 } );

		expect( groupKey( loginGated ) ).not.toBe( groupKey( firewalled ) );
	} );

	it( 'groups login-gated pages with each other', () => {
		const one = errorAt( 'https://example.com/members/', { code: 403, login_required: true } );
		const two = errorAt( 'https://example.com/account/', { code: 403, login_required: true } );

		expect( groupKey( one ) ).toBe( groupKey( two ) );
	} );

	it( 'describes a mixed crawl as two sets, each with its own advice', () => {
		const sets = groupErrorsByFrequency( [
			errorAt( 'https://example.com/members/', { code: 403, login_required: true } ),
			errorAt( 'https://example.com/internal/', { code: 403 } ),
		] );
		const described = sets.map( set => describeErrorSet( set ) );

		expect( sets ).toHaveLength( 2 );

		expect( described.some( text => text.includes( 'only shown to logged-in visitors' ) ) ).toBe(
			true
		);
		expect( described.some( text => text.includes( 'HTTP error' ) ) ).toBe( true );
	} );
} );

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
