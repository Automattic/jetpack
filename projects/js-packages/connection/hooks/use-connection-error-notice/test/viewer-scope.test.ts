import { isOtherUsersConnectionError } from '../viewer-scope';
import type { ConnectionErrorObject } from '../types';

/**
 * Build an error, defaulting the one field the type requires.
 *
 * @param {Partial< ConnectionErrorObject >} overrides - The fields under test.
 * @return {ConnectionErrorObject} The error.
 */
const anError = ( overrides: Partial< ConnectionErrorObject > = {} ): ConnectionErrorObject => ( {
	error_message: 'Your Jetpack connection needs attention.',
	...overrides,
} );

describe( 'isOtherUsersConnectionError', () => {
	it( "places another user's broken token with them", () => {
		expect( isOtherUsersConnectionError( anError( { audience: 'user', user_id: '99' } ), 7 ) ).toBe(
			true
		);
	} );

	it( "claims the viewer's own error as theirs", () => {
		expect( isOtherUsersConnectionError( anError( { audience: 'user', user_id: '7' } ), 7 ) ).toBe(
			false
		);
	} );

	// `user_id` arrives as a string from the REST payload while the viewer's ID is
	// a number, so the comparison has to coerce.
	it( 'matches a string user_id against the numeric viewer ID', () => {
		expect(
			isOtherUsersConnectionError( anError( { audience: 'user', user_id: '007' } ), 7 )
		).toBe( false );
	} );

	// Those break the site's own connection, so every admin has a stake in them
	// regardless of whose token is named.
	it.each( [ 'site', 'owner' ] as const )(
		'never places a %s-audience error elsewhere',
		audience => {
			expect( isOtherUsersConnectionError( anError( { audience, user_id: '99' } ), 7 ) ).toBe(
				false
			);
		}
	);

	// Older payloads predate the `audience` field; site-wide is the safe reading.
	it( 'treats a missing audience as site-wide', () => {
		expect( isOtherUsersConnectionError( anError( { user_id: '99' } ), 7 ) ).toBe( false );
	} );

	// With one side of the comparison missing there is no basis for calling the
	// error somebody else's, and doing so would hide a real problem.
	it( 'does not place an error when the viewer is unidentified', () => {
		expect(
			isOtherUsersConnectionError( anError( { audience: 'user', user_id: '99' } ), undefined )
		).toBe( false );
	} );

	it( 'does not place an unattributed error', () => {
		expect( isOtherUsersConnectionError( anError( { audience: 'user' } ), 7 ) ).toBe( false );
	} );

	it( 'survives a missing error', () => {
		expect( isOtherUsersConnectionError( undefined, 7 ) ).toBe( false );
	} );
} );
