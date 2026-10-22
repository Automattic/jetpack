const assert = require( 'node:assert/strict' );
const { before, describe, it } = require( 'node:test' );

let getAccountSections;

before( async () => {
	( { getAccountSections } = await import( '../../src/connectors/js/account-sections.mjs' ) );
} );

const owner = { displayName: 'Owner' };
const brokenOwner = { displayName: 'Owner', isConnectionBroken: true };
const secondAdmin = { displayName: 'Second', isOwner: false };
const ownerViewing = { displayName: 'Owner', isOwner: true };

describe( 'getAccountSections', () => {
	const none = { connectPrompt: false, unconfirmedOwnerRow: false, ownerRow: false };

	for ( const [ name, state, expected ] of [
		[
			'broken owner with the owner banner: banner only',
			{ owner: brokenOwner, ownerIsViewer: true, isOwnerReconnectOffered: true },
			none,
		],
		[
			'broken owner without the owner banner: prompt, no row for themselves',
			{ owner: brokenOwner, ownerIsViewer: true, isOwnerReconnectOffered: false },
			{ ...none, connectPrompt: true },
		],
		[
			'broken owner while a protected owner is pending: no unconfirmed row for themselves',
			{ owner: brokenOwner, ownerIsViewer: true, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true },
		],
		[
			'unlinked admin with the owner banner: owner row, no takeover prompt',
			{ owner: brokenOwner, isOwnerReconnectOffered: true },
			{ ...none, ownerRow: true },
		],
		[
			'unlinked admin offered no owner reconnect (no banner, or ownership locked): takeover prompt and owner row',
			{ owner: brokenOwner, isOwnerReconnectOffered: false },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'admin beside a broken owner while a protected owner is pending: owner row, not unconfirmed',
			{ owner: brokenOwner, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'linked admin beside a broken owner: owner row only',
			{ viewer: secondAdmin, owner: brokenOwner, isOwnerReconnectOffered: true },
			{ ...none, ownerRow: true },
		],
		[
			'healthy owner: their account row stands in for the owner row',
			{ viewer: ownerViewing, owner, ownerIsViewer: true },
			none,
		],
		[
			'unlinked admin beside a healthy owner: prompt and owner row',
			{ owner },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'protected owner pending: unconfirmed row replaces the owner row',
			{ viewer: secondAdmin, owner: owner, isProtectedOwnerPending: true },
			{ ...none, unconfirmedOwnerRow: true },
		],
		[ 'site with no owner: prompt only', { owner: null }, { ...none, connectPrompt: true } ],
		[ 'no connect action: no prompt', { owner, canConnect: false }, { ...none, ownerRow: true } ],
	] ) {
		it( name, () => {
			assert.deepEqual(
				getAccountSections( {
					viewer: null,
					ownerIsViewer: false,
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
