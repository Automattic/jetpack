import {
	flattenConnectionErrors,
	getConnectionErrorDetail,
	getConnectionErrorDetailLines,
	getConnectionErrorScope,
	getConnectionErrorTitle,
	groupConnectionErrorsByMessage,
	titleIncludesScope,
} from '../connection-error-details';
import type { ConnectionErrorMap, ConnectionErrorObject } from '@automattic/jetpack-connection';

// `@wordpress/i18n` is deliberately left unmocked: the plural selection and
// positional-placeholder substitution are part of what these helpers get right,
// so they are exercised for real rather than through an identity stub.

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

describe( 'flattenConnectionErrors', () => {
	it( 'flattens every user under every error code', () => {
		const errors: ConnectionErrorMap = {
			invalid_token: {
				7: anError( { error_code: 'invalid_token', user_id: '7' } ),
				9: anError( { error_code: 'invalid_token', user_id: '9' } ),
			},
			no_valid_blog_token: {
				0: anError( { error_code: 'no_valid_blog_token', user_id: '0' } ),
			},
		};

		expect( flattenConnectionErrors( errors ).map( error => error.user_id ) ).toEqual( [
			'7',
			'9',
			'0',
		] );
	} );

	it( 'returns nothing for an empty map', () => {
		expect( flattenConnectionErrors( {} ) ).toEqual( [] );
	} );

	// The map arrives as server-provided JSON through an untyped store, so these
	// shapes are reachable at runtime even though the types forbid them. Casting
	// is the point of the test, not an escape from it.
	it.each( [
		[ 'null', null ],
		[ 'undefined', undefined ],
		[ 'an array', [] as unknown as ConnectionErrorMap ],
		[ 'a string', 'nope' as unknown as ConnectionErrorMap ],
	] )( 'returns nothing when the map is %s', ( _label, errors ) => {
		expect( flattenConnectionErrors( errors as ConnectionErrorMap | null | undefined ) ).toEqual(
			[]
		);
	} );

	it( 'skips a code whose value is not a user map', () => {
		const errors = {
			invalid_token: null,
			no_valid_blog_token: { 0: anError( { user_id: '0' } ) },
		} as unknown as ConnectionErrorMap;

		expect( flattenConnectionErrors( errors ) ).toHaveLength( 1 );
	} );

	it( 'drops errors with no message, since there would be nothing to render', () => {
		const errors = {
			invalid_token: {
				7: { error_code: 'invalid_token' },
				9: anError( { user_id: '9' } ),
			},
		} as unknown as ConnectionErrorMap;

		expect( flattenConnectionErrors( errors ).map( error => error.user_id ) ).toEqual( [ '9' ] );
	} );
} );

describe( 'groupConnectionErrorsByMessage', () => {
	it( 'collects errors sharing a message under one group', () => {
		const errors = [
			anError( { error_message: 'Token broken.', user_id: '7' } ),
			anError( { error_message: 'Site disconnected.', user_id: '0' } ),
			anError( { error_message: 'Token broken.', user_id: '9' } ),
		];

		const groups = groupConnectionErrorsByMessage( errors );

		expect( groups ).toHaveLength( 2 );
		expect( groups[ 0 ].message ).toBe( 'Token broken.' );
		expect( groups[ 0 ].errors.map( error => error.user_id ) ).toEqual( [ '7', '9' ] );
		expect( groups[ 1 ].errors ).toHaveLength( 1 );
	} );

	it( 'returns nothing for no errors', () => {
		expect( groupConnectionErrorsByMessage( [] ) ).toEqual( [] );
	} );
} );

describe( 'getConnectionErrorScope', () => {
	describe( 'owner-audience errors', () => {
		const ownerError = anError( { audience: 'owner', user_id: '3' } );

		it( 'speaks in the first person to the owner themselves', () => {
			expect(
				getConnectionErrorScope( ownerError, { isOwner: true, ownerName: 'Site Owner' } )
			).toBe( 'Your account (connection owner)' );
		} );

		it( 'names the owner to a viewer allowed to see who they are', () => {
			expect(
				getConnectionErrorScope( ownerError, { isOwner: false, ownerName: 'Site Owner' } )
			).toBe( "Connection owner's account (Site Owner)" );
		} );

		// `connectionOwner` is gated on `jetpack_connect` server-side, so a viewer
		// without it gets the role without the identity.
		it( 'omits the name when the owner identity is withheld', () => {
			expect( getConnectionErrorScope( ownerError, { isOwner: false } ) ).toBe(
				"Connection owner's account"
			);
		} );
	} );

	describe( 'user-audience errors', () => {
		it( "claims the viewer's own error as theirs", () => {
			const error = anError( { audience: 'user', user_id: '7' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 } ) ).toBe( 'Your account' );
		} );

		// `user_id` arrives as a string from the REST payload while the viewer's ID
		// is a number, so the comparison has to coerce.
		it( 'matches a string user_id against the numeric viewer ID', () => {
			const error = anError( { audience: 'user', user_id: '007' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 } ) ).toBe( 'Your account' );
		} );

		it( "attributes someone else's error to another user", () => {
			const error = anError( { audience: 'user', user_id: '9' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 } ) ).toBe(
				"Another user's account"
			);
		} );

		it( 'counts other users rather than listing them', () => {
			const error = anError( { audience: 'user', user_id: '9' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 }, 3 ) ).toBe(
				"3 other users' accounts"
			);
		} );

		it( 'stays singular for a count of one', () => {
			const error = anError( { audience: 'user', user_id: '9' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 }, 1 ) ).toBe(
				"Another user's account"
			);
		} );

		it( 'does not claim an unattributed error when the viewer is unknown', () => {
			const error = anError( { audience: 'user' } );

			expect( getConnectionErrorScope( error, {} ) ).toBe( "Another user's account" );
		} );
	} );

	it( 'describes a site-audience error as the site connection', () => {
		expect( getConnectionErrorScope( anError( { audience: 'site' } ), { currentUserId: 7 } ) ).toBe(
			'Site connection'
		);
	} );

	// Older payloads predate the `audience` field; site-wide is the safe reading
	// because it claims nothing about any particular user.
	it( 'treats a missing audience as site-wide', () => {
		expect( getConnectionErrorScope( anError(), { currentUserId: 7 } ) ).toBe( 'Site connection' );
	} );

	it( 'works with no viewer at all', () => {
		expect( getConnectionErrorScope( anError( { audience: 'owner' } ) ) ).toBe(
			"Connection owner's account"
		);
	} );
} );

describe( 'getConnectionErrorDetail', () => {
	it( 'appends the raw error code so it can be quoted to support', () => {
		const error = anError( { audience: 'site', error_code: 'no_valid_blog_token' } );

		expect( getConnectionErrorDetail( error ) ).toBe(
			'Site connection · Error code: no_valid_blog_token'
		);
	} );

	it( 'falls back to the scope alone when there is no code', () => {
		expect( getConnectionErrorDetail( anError( { audience: 'site' } ) ) ).toBe( 'Site connection' );
	} );

	// Reachable from a server payload that types cannot police.
	it( 'ignores a non-string error code', () => {
		const error = {
			...anError( { audience: 'site' } ),
			error_code: 500,
		} as unknown as ConnectionErrorObject;

		expect( getConnectionErrorDetail( error ) ).toBe( 'Site connection' );
	} );

	it( 'passes the count through to the scope', () => {
		const error = anError( { audience: 'user', user_id: '9', error_code: 'invalid_token' } );

		expect( getConnectionErrorDetail( error, { currentUserId: 7 }, { count: 2 } ) ).toBe(
			"2 other users' accounts · Error code: invalid_token"
		);
	} );

	// The scope is in the notice title for a single error, so repeating it in the
	// line below reads as a duplication bug.
	describe( 'with the scope omitted', () => {
		it( 'returns the code alone', () => {
			const error = anError( { audience: 'owner', error_code: 'invalid_connection_owner' } );

			expect( getConnectionErrorDetail( error, { isOwner: true }, { omitScope: true } ) ).toBe(
				'Error code: invalid_connection_owner'
			);
		} );

		it( 'returns nothing when there is no code left to show', () => {
			expect(
				getConnectionErrorDetail( anError( { audience: 'site' } ), {}, { omitScope: true } )
			).toBe( '' );
		} );
	} );
} );

describe( 'getConnectionErrorDetailLines', () => {
	// Several admins hitting one error code all reduce to "another user's
	// account". Rendering those verbatim reads as a duplication bug.
	it( 'collapses lines that would read identically into one counted line', () => {
		const errors = [
			anError( { audience: 'user', user_id: '9', error_code: 'invalid_token' } ),
			anError( { audience: 'user', user_id: '11', error_code: 'invalid_token' } ),
			anError( { audience: 'user', user_id: '12', error_code: 'invalid_token' } ),
		];

		const lines = getConnectionErrorDetailLines( errors, { currentUserId: 7 } );

		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ].text ).toBe( "3 other users' accounts · Error code: invalid_token" );
	} );

	it( 'keeps the singular wording for a line standing for one error', () => {
		const errors = [ anError( { audience: 'user', user_id: '9', error_code: 'invalid_token' } ) ];

		expect( getConnectionErrorDetailLines( errors, { currentUserId: 7 } )[ 0 ].text ).toBe(
			"Another user's account · Error code: invalid_token"
		);
	} );

	it( 'keeps lines that read differently apart', () => {
		const errors = [
			anError( { audience: 'site', error_code: 'no_valid_blog_token' } ),
			anError( { audience: 'user', user_id: '7', error_code: 'invalid_token' } ),
			anError( { audience: 'user', user_id: '9', error_code: 'invalid_token' } ),
		];

		const lines = getConnectionErrorDetailLines( errors, { currentUserId: 7 } );

		expect( lines.map( line => line.text ) ).toEqual( [
			'Site connection · Error code: no_valid_blog_token',
			'Your account · Error code: invalid_token',
			"Another user's account · Error code: invalid_token",
		] );
	} );

	// The keys go straight into a React list.
	it( 'gives every line a distinct key', () => {
		const errors = [
			anError( { audience: 'site', error_code: 'no_valid_blog_token' } ),
			anError( { audience: 'user', user_id: '7', error_code: 'invalid_token' } ),
			anError( { audience: 'owner', user_id: '3' } ),
		];

		const keys = getConnectionErrorDetailLines( errors, { currentUserId: 7 } ).map(
			line => line.key
		);

		expect( new Set( keys ).size ).toBe( keys.length );
	} );

	it( 'returns nothing for no errors', () => {
		expect( getConnectionErrorDetailLines( [] ) ).toEqual( [] );
	} );

	describe( 'with the scope omitted', () => {
		it( 'renders the code alone', () => {
			const errors = [ anError( { audience: 'owner', error_code: 'invalid_connection_owner' } ) ];

			expect(
				getConnectionErrorDetailLines( errors, { isOwner: true }, true ).map( line => line.text )
			).toEqual( [ 'Error code: invalid_connection_owner' ] );
		} );

		// Without the scope there is nothing to distinguish them, and nothing worth
		// counting either — the count only ever qualified the scope.
		it( 'collapses errors sharing a code across different scopes', () => {
			const errors = [
				anError( { audience: 'user', user_id: '9', error_code: 'invalid_token' } ),
				anError( { audience: 'user', user_id: '11', error_code: 'invalid_token' } ),
			];

			expect(
				getConnectionErrorDetailLines( errors, { currentUserId: 7 }, true ).map( line => line.text )
			).toEqual( [ 'Error code: invalid_token' ] );
		} );

		it( 'drops an error that has no code, leaving nothing to render', () => {
			expect(
				getConnectionErrorDetailLines( [ anError( { audience: 'site' } ) ], {}, true )
			).toEqual( [] );
		} );
	} );
} );

// The title and the detail lines below it have to agree on who states the
// scope, or it either doubles up or vanishes from the notice entirely.
describe( 'titleIncludesScope', () => {
	it( 'is true for a single error, which the title names', () => {
		expect( titleIncludesScope( [ anError( { audience: 'site' } ) ] ) ).toBe( true );
	} );

	it( 'is false when the title counts errors instead of naming one', () => {
		expect(
			titleIncludesScope( [ anError( { audience: 'site' } ), anError( { audience: 'owner' } ) ] )
		).toBe( false );
	} );

	it( 'is false when there is nothing to name', () => {
		expect( titleIncludesScope( [] ) ).toBe( false );
	} );
} );

describe( 'getConnectionErrorTitle', () => {
	it( 'names the affected scope when there is a single error', () => {
		const errors = [ anError( { audience: 'user', user_id: '7' } ) ];

		expect( getConnectionErrorTitle( errors, { currentUserId: 7 } ) ).toBe(
			'Jetpack connection error: Your account'
		);
	} );

	// With several errors no single scope is the subject, so the title counts them
	// and leaves the scopes to the detail lines.
	it( 'counts the errors when there is more than one', () => {
		const errors = [
			anError( { audience: 'site' } ),
			anError( { audience: 'user', user_id: '7' } ),
		];

		expect( getConnectionErrorTitle( errors, { currentUserId: 7 } ) ).toBe(
			'2 Jetpack connection errors'
		);
	} );

	it( 'falls back to a generic title when there are no errors', () => {
		expect( getConnectionErrorTitle( [] ) ).toBe( 'Jetpack connection error' );
	} );
} );
