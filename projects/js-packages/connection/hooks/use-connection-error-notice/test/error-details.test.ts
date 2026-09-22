import {
	excludeOtherUsersErrors,
	flattenConnectionErrors,
	getConnectionErrorDetailLines,
	getConnectionErrorDetails,
	getConnectionErrorNoticeLinks,
	getConnectionErrorScope,
	getConnectionErrorTitle,
	groupConnectionErrorsByMessage,
	hasSupportLink,
	isConnectionErrorMap,
	titleIncludesScope,
} from '../error-details';
import type { ConnectionErrorMap, ConnectionErrorObject } from '../types';

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

// The store declares `connectionErrors` as an array but hands over a
// code → user → error object, and falls back to `[]` when there is nothing. This
// predicate is what keeps that mismatch narrowed in one place, so the shapes it
// must reject are the ones the store really produces.
describe( 'isConnectionErrorMap', () => {
	it( 'accepts a code → user → error object', () => {
		expect( isConnectionErrorMap( { invalid_token: { 7: anError() } } ) ).toBe( true );
	} );

	it( 'accepts an empty object', () => {
		expect( isConnectionErrorMap( {} ) ).toBe( true );
	} );

	it.each( [
		[ "the selector's empty-array fallback", [] ],
		[ 'a populated array', [ 'nope' ] ],
		[ 'null', null ],
		[ 'undefined', undefined ],
		[ 'a string', 'nope' ],
	] )( 'rejects %s', ( _label, value ) => {
		expect( isConnectionErrorMap( value ) ).toBe( false );
	} );
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

describe( 'excludeOtherUsersErrors', () => {
	const viewer = { currentUserId: 7 };

	it( "drops another user's broken token, which this viewer can neither fix nor is affected by", () => {
		const errors = [ anError( { audience: 'user', user_id: '99' } ) ];

		expect( excludeOtherUsersErrors( errors, viewer ) ).toEqual( [] );
	} );

	it( 'keeps the errors every admin has a stake in', () => {
		const errors = [
			anError( { audience: 'site', user_id: '0' } ),
			anError( { audience: 'owner', user_id: '3' } ),
			anError( { audience: 'user', user_id: '7' } ),
		];

		expect( excludeOtherUsersErrors( errors, viewer ) ).toEqual( errors );
	} );

	// The rule for what counts as somebody else's error lives in `viewer-scope` and
	// is covered by its own tests; these two cases pin the filtering this helper
	// adds on top of it.
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

		// `Error_Handler` keeps another user's error out of this viewer's set, so the
		// label is only reached for a consumer-injected error.
		it( "attributes someone else's error to another user", () => {
			const error = anError( { audience: 'user', user_id: '9' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 } ) ).toBe(
				"Another user's account"
			);
		} );

		// An error that cannot be placed is kept by `excludeOtherUsersErrors` because
		// it could be the viewer's own, so the label must not contradict that by
		// handing it to somebody else.
		it( 'does not claim an unattributed error when the viewer is unknown', () => {
			const error = anError( { audience: 'user' } );

			expect( getConnectionErrorScope( error, {} ) ).toBe( 'User connection' );
		} );

		it( 'does not claim an attributed error when the viewer is unknown', () => {
			const error = anError( { audience: 'user', user_id: '9' } );

			expect( getConnectionErrorScope( error, {} ) ).toBe( 'User connection' );
		} );

		it( 'does not claim an unattributed error when the viewer is known', () => {
			const error = anError( { audience: 'user' } );

			expect( getConnectionErrorScope( error, { currentUserId: 7 } ) ).toBe( 'User connection' );
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

describe( 'getConnectionErrorDetailLines', () => {
	// Two errors can describe the same thing to this viewer — two codes both
	// reported against the blog token. Rendering both verbatim reads as a
	// duplication bug.
	it( 'collapses lines that would read identically', () => {
		const errors = [
			anError( { audience: 'site', error_code: 'invalid_token' } ),
			anError( { audience: 'site', error_code: 'no_valid_blog_token' } ),
		];

		const lines = getConnectionErrorDetailLines( errors, { currentUserId: 7 } );

		expect( lines ).toHaveLength( 1 );
		expect( lines[ 0 ].text ).toBe( 'Site connection' );
	} );

	it( 'keeps lines that read differently apart', () => {
		const errors = [
			anError( { audience: 'site', error_code: 'no_valid_blog_token' } ),
			anError( { audience: 'user', user_id: '7', error_code: 'invalid_token' } ),
			anError( { audience: 'owner', user_id: '3', error_code: 'invalid_connection_owner' } ),
		];

		const lines = getConnectionErrorDetailLines( errors, { currentUserId: 7 } );

		expect( lines.map( line => line.text ) ).toEqual( [
			'Site connection',
			'Your account',
			"Connection owner's account",
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

	// The codes are developer vocabulary (`no_possible_tokens`, `could_not_sign`) and
	// the message already says what to do, so they are never shown to the admin.
	it( 'never shows the raw error code', () => {
		const errors = [ anError( { audience: 'site', error_code: 'no_valid_blog_token' } ) ];

		expect( getConnectionErrorDetailLines( errors )[ 0 ].text ).not.toContain(
			'no_valid_blog_token'
		);
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
			'Jetpack Connection error: Your account'
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
			'2 Jetpack Connection errors'
		);
	} );

	it( 'falls back to a generic title when there are no errors', () => {
		expect( getConnectionErrorTitle( [] ) ).toBe( 'Jetpack Connection error' );
	} );
} );

describe( 'getConnectionErrorNoticeLinks', () => {
	const siteHealth = {
		label: 'Visit Site Health',
		url: 'https://example.com/wp-admin/site-health.php',
	};

	it( 'offers a link the error declares', () => {
		const errors = [ anError( { error_data: { notice_link: siteHealth } } ) ];

		expect( getConnectionErrorNoticeLinks( errors ) ).toEqual( [ siteHealth ] );
	} );

	// Two codes can report the same condition and carry the same link; offering it
	// twice reads as a duplication bug.
	it( 'offers a repeated link only once', () => {
		const errors = [
			anError( { error_code: 'xmlrpc_request_blocked', error_data: { notice_link: siteHealth } } ),
			anError( { error_code: 'no_valid_blog_token', error_data: { notice_link: siteHealth } } ),
		];

		expect( getConnectionErrorNoticeLinks( errors ) ).toHaveLength( 1 );
	} );

	it( 'keeps distinct links apart', () => {
		const other = { label: 'Read the docs', url: 'https://example.com/docs' };
		const errors = [
			anError( { error_data: { notice_link: siteHealth } } ),
			anError( { error_data: { notice_link: other } } ),
		];

		expect( getConnectionErrorNoticeLinks( errors ) ).toEqual( [ siteHealth, other ] );
	} );

	// The link is server-provided and reaches us through an untyped store, so a
	// half-built link is reachable at runtime — and a link with no text, or one
	// that points nowhere, is worse than no link at all.
	it.each( [
		[ 'no url', { label: 'Visit Site Health' } ],
		[ 'no label', { url: 'https://example.com' } ],
		[ 'an empty url', { label: 'Visit Site Health', url: '' } ],
		[ 'a non-object link', 'https://example.com' ],
	] )( 'ignores a link with %s', ( _label, notice_link ) => {
		const errors = [
			anError( { error_data: { notice_link } as ConnectionErrorObject[ 'error_data' ] } ),
		];

		expect( getConnectionErrorNoticeLinks( errors ) ).toEqual( [] );
	} );

	it( 'returns nothing when no error declares one', () => {
		expect( getConnectionErrorNoticeLinks( [ anError() ] ) ).toEqual( [] );
	} );
} );

describe( 'hasSupportLink', () => {
	it( 'is true when any error asks for one', () => {
		const errors = [ anError(), anError( { error_data: { support_link: true } } ) ];

		expect( hasSupportLink( errors ) ).toBe( true );
	} );

	it( 'is false when none does', () => {
		expect( hasSupportLink( [ anError(), anError( { error_data: {} } ) ] ) ).toBe( false );
	} );

	it( 'is false when there is nothing to ask', () => {
		expect( hasSupportLink( [] ) ).toBe( false );
	} );
} );

// The one entry point consumers use: everything a notice needs, derived once so
// the package's own notice and My Jetpack's cannot drift apart.
describe( 'getConnectionErrorDetails', () => {
	const viewer = { currentUserId: 7 };

	it( 'derives the title, the groups and the links from the store map', () => {
		const errors: ConnectionErrorMap = {
			xmlrpc_request_blocked: {
				0: anError( {
					error_message: 'WordPress.com requests to your site are being blocked.',
					audience: 'site',
					user_id: '0',
					error_data: {
						support_link: true,
						notice_link: { label: 'Visit Site Health', url: '/wp-admin/site-health.php' },
					},
				} ),
			},
			invalid_token: {
				7: anError( { error_message: 'Token broken.', audience: 'user', user_id: '7' } ),
			},
		};

		const details = getConnectionErrorDetails( errors, viewer );

		expect( details.errors ).toHaveLength( 2 );
		expect( details.title ).toBe( '2 Jetpack Connection errors' );
		expect( details.groups.map( group => group.message ) ).toEqual( [
			'WordPress.com requests to your site are being blocked.',
			'Token broken.',
		] );
		// More than one error, so the title counts rather than naming a scope and
		// each group states its own.
		expect( details.groups[ 0 ].detailLines.map( line => line.text ) ).toEqual( [
			'Site connection',
		] );
		expect( details.groups[ 1 ].detailLines.map( line => line.text ) ).toEqual( [
			'Your account',
		] );
		expect( details.showSupportLink ).toBe( true );
		// Attached to the group whose error asked for it, not pooled across groups —
		// the second group (`invalid_token`) asked for no link and carries none.
		expect( details.groups[ 0 ].noticeLinks ).toEqual( [
			{ label: 'Visit Site Health', url: '/wp-admin/site-health.php' },
		] );
		expect( details.groups[ 1 ].noticeLinks ).toEqual( [] );
	} );

	// Two different-message groups can still point at the same link (e.g. both
	// diagnosable via Site Health). Showing it under both would read as two
	// separate suggestions rather than one, so only the first group keeps it.
	it( 'shows a link shared by two different error groups only once', () => {
		const sharedLink = { label: 'Visit Site Health', url: '/wp-admin/site-health.php' };
		const errors: ConnectionErrorMap = {
			xmlrpc_request_blocked: {
				0: anError( {
					error_message: 'WordPress.com requests to your site are being blocked.',
					audience: 'site',
					user_id: '0',
					error_data: { notice_link: sharedLink },
				} ),
			},
			another_blocked_code: {
				7: anError( {
					error_message: 'A different problem, same diagnosis.',
					audience: 'user',
					user_id: '7',
					error_data: { notice_link: sharedLink },
				} ),
			},
		};

		const details = getConnectionErrorDetails( errors, viewer );

		expect( details.groups[ 0 ].noticeLinks ).toEqual( [ sharedLink ] );
		expect( details.groups[ 1 ].noticeLinks ).toEqual( [] );
	} );

	// A single error's scope is already in the title, so repeating it below would
	// state the same thing twice.
	it( 'leaves the scope to the title when there is one error', () => {
		const errors: ConnectionErrorMap = {
			no_valid_blog_token: { 0: anError( { audience: 'site', user_id: '0' } ) },
		};

		const details = getConnectionErrorDetails( errors, viewer );

		expect( details.title ).toBe( 'Jetpack Connection error: Site connection' );
		expect( details.groups[ 0 ].detailLines ).toEqual( [] );
	} );

	it( "drops another user's error, which this viewer can neither fix nor is affected by", () => {
		const errors: ConnectionErrorMap = {
			invalid_token: { 99: anError( { audience: 'user', user_id: '99' } ) },
		};

		const details = getConnectionErrorDetails( errors, viewer );

		expect( details.errors ).toEqual( [] );
		expect( details.groups ).toEqual( [] );
	} );

	it( 'copes with an empty store', () => {
		const details = getConnectionErrorDetails( {} );

		expect( details.errors ).toEqual( [] );
		expect( details.groups ).toEqual( [] );
		expect( details.title ).toBe( 'Jetpack Connection error' );
		expect( details.showSupportLink ).toBe( false );
	} );
} );
