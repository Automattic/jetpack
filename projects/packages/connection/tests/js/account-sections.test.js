const assert = require( 'node:assert/strict' );
const { before, describe, it } = require( 'node:test' );

let getAccountSections, getConnectPromptKind, offersOwnerReconnect;

before( async () => {
	( { getAccountSections, getConnectPromptKind, offersOwnerReconnect } =
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
			{ connectionOwner: brokenOwnerViewing, isOwnerReconnectOffered: true },
			none,
		],
		[
			'broken owner without the owner banner: prompt, no row for themselves',
			{ connectionOwner: brokenOwnerViewing, isOwnerReconnectOffered: false },
			{ ...none, connectPrompt: true },
		],
		[
			'broken owner while a protected owner is pending: no unconfirmed row for themselves',
			{ connectionOwner: brokenOwnerViewing, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true },
		],
		[
			'unlinked admin with the owner banner: owner row, no takeover prompt',
			{ connectionOwner: brokenOwner, isOwnerReconnectOffered: true },
			{ ...none, ownerRow: true },
		],
		[
			'unlinked admin offered no owner reconnect (no banner, or ownership locked): takeover prompt and owner row',
			{ connectionOwner: brokenOwner, isOwnerReconnectOffered: false },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'admin beside a broken owner while a protected owner is pending: owner row, not unconfirmed',
			{ connectionOwner: brokenOwner, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'linked admin beside a broken owner: owner row only',
			{ currentUser: secondAdmin, connectionOwner: brokenOwner, isOwnerReconnectOffered: true },
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
					isOwnerReconnectOffered: false,
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

describe( 'offersOwnerReconnect', () => {
	for ( const [ name, notice, expected ] of [
		[ 'an owner error with a CTA', { displayableErrors: [ { audience: 'owner' } ] }, true ],
		[
			'a locked owner error (action none)',
			{ displayableErrors: [ { audience: 'owner', error_data: { action: 'none' } } ] },
			false,
		],
		[ 'a site error', { displayableErrors: [ { audience: 'site' } ] }, false ],
		[ 'no notice', null, false ],
	] ) {
		it( `is ${ expected } for ${ name }`, () => {
			assert.equal( offersOwnerReconnect( notice ), expected );
		} );
	}
} );
