import { describeErrorSet, suggestion } from './describe-critical-css-recommendations';
import type { ErrorSet } from './critical-css-errors';

function httpErrorSet( meta: Record< string, unknown > ): ErrorSet {
	return {
		type: 'HttpError',
		firstMeta: meta,
		byUrl: {
			'https://example.com/members/': {
				url: 'https://example.com/members/',
				message: 'HTTP 403',
				type: 'HttpError',
				meta,
			},
		},
	} as ErrorSet;
}

describe( 'HttpError descriptions', () => {
	it( 'names the login gate when the site answered with it', () => {
		const set = httpErrorSet( { code: 403, login_required: true } );

		expect( describeErrorSet( set ) ).toContain( 'only shown to logged-in visitors' );
		expect( suggestion( set ).paragraph ).toContain( 'logged-out visitor' );
	} );

	it( 'describes any other 403 as an HTTP error', () => {
		const set = httpErrorSet( { code: 403 } );

		expect( describeErrorSet( set ) ).toContain( 'HTTP error' );
		expect( suggestion( set ).paragraph ).not.toContain( 'logged-out visitor' );
	} );
} );
