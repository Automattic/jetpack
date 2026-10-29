const assert = require( 'node:assert/strict' );
const { before, describe, it } = require( 'node:test' );

let getAccountSections;

before( async () => {
	( { getAccountSections } = await import( '../../src/connectors/js/account-sections.mjs' ) );
} );

const owner = { displayName: 'Owner' };
const brokenOwner = { owner, isOwnerConnectionBroken: true };
const secondAdmin = { displayName: 'Second', isOwner: false };
const ownerViewing = { displayName: 'Owner', isOwner: true };

describe( 'getAccountSections', () => {
	const none = { connectPrompt: false, unconfirmedOwnerRow: false, ownerRow: false };

	for ( const [ name, state, expected ] of [
		[
			'broken owner with the banner: banner only',
			{ ...brokenOwner, ownerIsViewer: true, isErrorBannerShown: true },
			none,
		],
		[
			'broken owner without the banner: prompt, no row for themselves',
			{ ...brokenOwner, ownerIsViewer: true, isErrorBannerShown: false },
			{ ...none, connectPrompt: true },
		],
		[
			'broken owner while a protected owner is pending: no unconfirmed row for themselves',
			{ ...brokenOwner, ownerIsViewer: true, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true },
		],
		[
			'unlinked admin beside a broken owner with the banner: owner row, no takeover prompt',
			{ ...brokenOwner, isErrorBannerShown: true },
			{ ...none, ownerRow: true },
		],
		[
			'unlinked admin beside a broken owner without the banner: takeover prompt and owner row',
			{ ...brokenOwner, isErrorBannerShown: false },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'admin beside a broken owner while a protected owner is pending: owner row, not unconfirmed',
			{ ...brokenOwner, isProtectedOwnerPending: true },
			{ ...none, connectPrompt: true, ownerRow: true },
		],
		[
			'linked admin beside a broken owner: owner row only',
			{ viewer: secondAdmin, ...brokenOwner, isErrorBannerShown: true },
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
			'unlinked admin beside a healthy owner with the banner: owner row, no prompt',
			{ owner, isErrorBannerShown: true },
			{ ...none, ownerRow: true },
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
					isOwnerConnectionBroken: false,
					canConnect: true,
					isErrorBannerShown: false,
					isProtectedOwnerPending: false,
					...state,
				} ),
				expected
			);
		} );
	}
} );
