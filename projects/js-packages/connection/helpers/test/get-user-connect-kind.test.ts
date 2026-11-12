import { getUserConnectKind, getUserConnectMessage } from '../get-user-connect-kind';

const owner = { id: 1, displayName: 'Owner', avatar: '' };

describe( 'getUserConnectKind', () => {
	it.each( [
		[
			'reconnect-owner',
			{ isRegistered: true, hasConnectedOwner: false, owner, currentUserId: 1 },
		],
		[ 'take-over', { isRegistered: true, hasConnectedOwner: false, owner, currentUserId: 2 } ],
		[
			'locked-owner',
			{
				isRegistered: true,
				hasConnectedOwner: false,
				owner,
				currentUserId: 2,
				canTakeOwnerSlot: false,
			},
		],
		[
			'reconnect-owner',
			{
				isRegistered: true,
				hasConnectedOwner: false,
				owner,
				currentUserId: 1,
				canTakeOwnerSlot: false,
			},
		],
		[ 'secondary', { isRegistered: true, hasConnectedOwner: true, owner, currentUserId: 2 } ],
		// A token WordPress.com rejects is still stored, so only the server can tell it is unusable.
		[
			'take-over',
			{
				isRegistered: true,
				hasConnectedOwner: true,
				owner,
				currentUserId: 2,
				canTakeOwnerSlot: true,
			},
		],
		// Viewers without jetpack_connect get no owner object, but a connected owner still exists.
		[ 'secondary', { isRegistered: true, hasConnectedOwner: true, owner: null, currentUserId: 2 } ],
		[ 'first', { isRegistered: true, hasConnectedOwner: false, owner: null, currentUserId: 2 } ],
		[ 'first', { isRegistered: false, hasConnectedOwner: false, owner, currentUserId: 2 } ],
	] )( 'returns %s', ( expected, state ) => {
		expect( getUserConnectKind( state ) ).toBe( expected );
	} );
} );

describe( 'getUserConnectMessage', () => {
	it.each( [
		[ 'reconnect-owner', 'Reconnect it' ],
		[ 'take-over', 'become the new connection owner' ],
		[ 'locked-owner', 'You can still connect' ],
		[ 'secondary', 'sign in via WordPress.com' ],
		[ 'first', 'Your site is registered' ],
	] as const )( 'describes %s', ( kind, phrase ) => {
		expect( getUserConnectMessage( kind ) ).toContain( phrase );
	} );
} );
