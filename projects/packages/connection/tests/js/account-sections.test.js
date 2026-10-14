const assert = require( 'node:assert/strict' );
const { before, describe, it } = require( 'node:test' );

let getAccountSections, getConnectPromptKind, hasOwnerError;

before( async () => {
	( { getAccountSections, getConnectPromptKind, hasOwnerError } =
		await import( '../../src/connectors/js/account-sections.mjs' ) );
} );

const owner = { displayName: 'Owner' };
const brokenOwner = { displayName: 'Owner', isConnectionBroken: true, isCurrentUser: false };
const brokenOwnerViewing = { ...brokenOwner, isCurrentUser: true };
const secondAdmin = { displayName: 'Second', isOwner: false };
const ownerViewing = { displayName: 'Owner', isOwner: true };

describe( 'getAccountSections', () => {
	const none = { connectPrompt: false, unconfirmedOwnerRow: false, ownerRow: false };

	for ( const [ name, state, expected ] of [
		[
			'broken owner with the owner banner: banner only',
			{ connectionOwner: brokenOwnerViewing, isOwnerErrorShown: true },
			none,
		],
		[
			'broken owner without the owner banner: prompt, no row for themselves',
			{ connectionOwner: brokenOwnerViewing, isOwnerErrorShown: false },
			{ ...none, connectPrompt: true },
		],
		[
			'broken owner while a protected owner is pending: no unconfirmed row for themselves',
			{ connectionOwner: brokenOwnerViewing, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true },
		],
		[
			'unlinked admin with the owner banner: owner row, no takeover prompt',
			{ connectionOwner: brokenOwner, isOwnerErrorShown: true },
			{ ...none, ownerRow: true },
		],
		[
			'unlinked admin without the owner banner: takeover prompt and owner row',
			{ connectionOwner: brokenOwner, isOwnerErrorShown: false },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'linked admin beside a broken owner: owner row only',
			{ currentUser: secondAdmin, connectionOwner: brokenOwner, isOwnerErrorShown: true },
			{ ...none, ownerRow: true },
		],
		[
			'healthy owner: their account row stands in for the owner row',
			{ currentUser: ownerViewing, connectionOwner: owner },
			none,
		],
		[
			'unlinked admin beside a healthy owner: prompt and owner row',
			{ connectionOwner: owner },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'protected owner pending: unconfirmed row replaces the owner row',
			{ currentUser: secondAdmin, connectionOwner: owner, isProtectedOwnerPending: true },
			{ ...none, unconfirmedOwnerRow: true },
		],
		[
			'site with no owner: prompt only',
			{ connectionOwner: null },
			{ ...none, connectPrompt: true },
		],
		[
			'no connect action: no prompt',
			{ connectionOwner: owner, canConnect: false },
			{ ...none, ownerRow: true },
		],
	] ) {
		it( name, () => {
			assert.deepEqual(
				getAccountSections( {
					currentUser: null,
					canConnect: true,
					isOwnerErrorShown: false,
					isProtectedOwnerPending: false,
					...state,
				} ),
				expected
			);
		} );
	}
} );

describe( 'getConnectPromptKind', () => {
	for ( const [ connectionOwner, expected ] of [
		[ brokenOwnerViewing, 'reconnect-owner' ],
		[ brokenOwner, 'take-over' ],
		[ owner, 'secondary' ],
		[ null, 'first' ],
	] ) {
		it( `returns ${ expected }`, () => {
			assert.equal( getConnectPromptKind( connectionOwner ), expected );
		} );
	}
} );

describe( 'hasOwnerError', () => {
	it( 'is true only when a displayed error is the owner’s', () => {
		assert.equal( hasOwnerError( { displayableErrors: [ { audience: 'owner' } ] } ), true );
		assert.equal( hasOwnerError( { displayableErrors: [ { audience: 'site' } ] } ), false );
		assert.equal( hasOwnerError( null ), false );
	} );
} );
