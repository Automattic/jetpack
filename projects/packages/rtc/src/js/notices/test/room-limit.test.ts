import { jest } from '@jest/globals';

const recordBlockedMock = jest.fn();

// room-limit.ts imports this as '../tracking/track-blocked'; from this test file
// (notices/test/) the same module resolves as '../../tracking/track-blocked'.
jest.unstable_mockModule( '../../tracking/track-blocked', () => ( {
	recordBlocked: recordBlockedMock,
} ) );

type StateSpec = Record< number, { id: number; enteredAt: number } >;

/**
 * Build a minimal fake awareness object for testing.
 *
 * @param spec     - Map of clientId to { id, enteredAt } collaborator info.
 * @param clientID - The local client ID.
 * @return A fake awareness object.
 */
function fakeAwareness( spec: StateSpec, clientID: number ) {
	const states = new Map< number, { collaboratorInfo?: { id?: number; enteredAt?: number } } >();
	for ( const key of Object.keys( spec ) ) {
		const { id, enteredAt } = spec[ Number( key ) ];
		states.set( Number( key ), { collaboratorInfo: { id, enteredAt } } );
	}
	const listeners = new Set< () => void >();
	return {
		clientID,
		getStates: () => states,
		on: ( _event: string, cb: () => void ) => {
			listeners.add( cb );
		},
		off: ( _event: string, cb: () => void ) => {
			listeners.delete( cb );
		},
	};
}

const makeProvider = () => ( { destroy: jest.fn(), on: jest.fn() } );

const entityRoom = ( awareness: unknown ) => ( {
	objectType: 'postType',
	objectId: 'post-1',
	ydoc: {} as never,
	awareness: awareness as never,
} );

describe( 'withRoomLimit blocked tracking', () => {
	beforeEach( () => {
		recordBlockedMock.mockClear();
		// Reset the module-level `breached` flag in room-limit.ts between tests.
		jest.resetModules();
	} );

	it( 'records a block when the local client is in the overflow set', async () => {
		const { withRoomLimit } = await import( '../room-limit' );
		// max 2; clientID 3 is newest (enteredAt 300) so it is the overflow client.
		const awareness = fakeAwareness(
			{ 1: { id: 7, enteredAt: 100 }, 2: { id: 8, enteredAt: 200 }, 3: { id: 9, enteredAt: 300 } },
			3
		);
		const wrapped = withRoomLimit( ( () => Promise.resolve( makeProvider() ) ) as never, 2 );

		await wrapped( entityRoom( awareness ) );

		expect( recordBlockedMock ).toHaveBeenCalledTimes( 1 );
		expect( recordBlockedMock ).toHaveBeenCalledWith( awareness );
	} );

	it( 'does not record a block when the local client is not in the overflow set', async () => {
		const { withRoomLimit } = await import( '../room-limit' );
		// clientID 1 is oldest (enteredAt 100) so it stays; the overflow is clientID 3.
		const awareness = fakeAwareness(
			{ 1: { id: 7, enteredAt: 100 }, 2: { id: 8, enteredAt: 200 }, 3: { id: 9, enteredAt: 300 } },
			1
		);
		const wrapped = withRoomLimit( ( () => Promise.resolve( makeProvider() ) ) as never, 2 );

		await wrapped( entityRoom( awareness ) );

		expect( recordBlockedMock ).not.toHaveBeenCalled();
	} );
} );
