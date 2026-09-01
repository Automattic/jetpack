import { jest } from '@jest/globals';

const recordRtcEventMock = jest.fn();
const addFilterMock = jest.fn();
const isRoomLimitBreachedMock = jest.fn( () => false );

jest.unstable_mockModule( '../tracks', () => ( {
	recordRtcEvent: recordRtcEventMock,
} ) );

jest.unstable_mockModule( '@wordpress/hooks', () => ( {
	addFilter: addFilterMock,
} ) );

jest.unstable_mockModule( '../../notices/room-limit', () => ( {
	isRoomLimitBreached: isRoomLimitBreachedMock,
} ) );

const { withJoinTracking, registerJoinTracking } = await import( '../track-join' );

type StateSpec = Record< number, number | null >;
type FakeAwarenessOptions = { states?: StateSpec; clientID?: number };

/**
 * Build a fake awareness keyed by client id. Each entry maps a client id to a WP
 * user id (or null for a state with no collaboratorInfo.id). `clientID` is the
 * local client. Exposes `emitChange()` and `setState()` so tests can simulate
 * presence appearing after provider creation.
 *
 * @param options - Fake awareness options (`states` keyed by client id, `clientID` for the local client).
 * @return A fake awareness object.
 */
function fakeAwareness( options: FakeAwarenessOptions = {} ) {
	const { states: spec = {}, clientID = 1 } = options;
	const states = new Map< number, { collaboratorInfo?: { id?: number } } >();
	const set = ( key: number, id: number | null ) =>
		states.set( key, { collaboratorInfo: id === null ? {} : { id } } );
	Object.keys( spec ).forEach( key => set( Number( key ), spec[ Number( key ) ] ) );
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
		emitChange: () => listeners.forEach( cb => cb() ),
		setState: set,
	};
}

const makeProvider = () => ( { destroy: jest.fn(), on: jest.fn() } );

const entityRoom = ( awareness: unknown ) => ( {
	objectType: 'postType',
	objectId: 'post-42',
	ydoc: {} as never,
	awareness: awareness as never,
} );

// Mirrors SETTLE_DELAY_MS in track-join.ts.
const SETTLE_DELAY_MS = 3000;

describe( 'withJoinTracking', () => {
	beforeEach( () => {
		recordRtcEventMock.mockClear();
		isRoomLimitBreachedMock.mockReturnValue( false );
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'records the settled roster a delay after the local client is present', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		// clientID 1 (user 7) is present, plus a second tab of user 7 and user 9.
		await wrapped( entityRoom( fakeAwareness( { states: { 1: 7, 2: 7, 3: 9 }, clientID: 1 } ) ) );

		// Nothing recorded until the settle delay elapses.
		expect( recordRtcEventMock ).not.toHaveBeenCalled();
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			contributor_count: 3,
			contributors: [ 7, 7, 9 ],
		} );
	} );

	it( 'captures peers that sync in during the settle delay', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		// The local client (user 7) joins; a peer's awareness has not synced yet.
		const awareness = fakeAwareness( { states: { 1: 7 }, clientID: 1 } );
		await wrapped( entityRoom( awareness ) );

		// A peer syncs in before the delay elapses.
		awareness.setState( 2, 9 );
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			contributor_count: 2,
			contributors: [ 7, 9 ],
		} );
	} );

	it( 'defers until the local client becomes present, then waits the delay', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		// At provider-creation time the local client has no awareness state yet.
		const awareness = fakeAwareness( { states: {}, clientID: 1 } );
		await wrapped( entityRoom( awareness ) );

		// The delay running out while absent records nothing.
		jest.advanceTimersByTime( SETTLE_DELAY_MS );
		expect( recordRtcEventMock ).not.toHaveBeenCalled();

		// Core-data populates the local client's collaboratorInfo and fires a change.
		awareness.setState( 1, 7 );
		awareness.emitChange();
		expect( recordRtcEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( SETTLE_DELAY_MS );
		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			contributor_count: 1,
			contributors: [ 7 ],
		} );
	} );

	it( 'does not record the join if the room limit was breached during the delay', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped( entityRoom( fakeAwareness( { states: { 1: 7 }, clientID: 1 } ) ) );

		// The client is turned away (room-limit block) before the settle fires.
		isRoomLimitBreachedMock.mockReturnValue( true );
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'records only once even if awareness changes again', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		const awareness = fakeAwareness( { states: { 1: 7 }, clientID: 1 } );
		await wrapped( entityRoom( awareness ) );

		jest.advanceTimersByTime( SETTLE_DELAY_MS );
		awareness.emitChange();
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not record for a collection room (objectId === null)', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped( {
			objectType: 'postType',
			objectId: null,
			ydoc: {} as never,
			awareness: fakeAwareness( { states: { 1: 7 }, clientID: 1 } ) as never,
		} );
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'does not record when awareness is absent', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped( {
			objectType: 'postType',
			objectId: 'post-42',
			ydoc: {} as never,
		} );
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'omits awareness states with no collaborator id', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped(
			entityRoom( fakeAwareness( { states: { 1: 7, 2: null, 3: 9 }, clientID: 1 } ) )
		);
		jest.advanceTimersByTime( SETTLE_DELAY_MS );

		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			contributor_count: 2,
			contributors: [ 7, 9 ],
		} );
	} );

	it( 'returns the inner provider result', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withJoinTracking( creator as never );

		const result = await wrapped(
			entityRoom( fakeAwareness( { states: { 1: 7 }, clientID: 1 } ) )
		);

		expect( result ).toBe( provider );
	} );
} );

describe( 'registerJoinTracking', () => {
	beforeEach( () => addFilterMock.mockClear() );

	it( 'registers a sync.providers filter at priority 30', () => {
		registerJoinTracking();

		expect( addFilterMock ).toHaveBeenCalledWith(
			'sync.providers',
			'jetpack/rtc-join-tracking',
			expect.any( Function ),
			30
		);
	} );

	it( 'wraps each provider creator with join tracking', () => {
		registerJoinTracking();

		const mapper = addFilterMock.mock.calls[ 0 ][ 2 ] as ( p: unknown[] ) => unknown[];
		const creatorA = jest.fn();
		const creatorB = jest.fn();
		const wrapped = mapper( [ creatorA, creatorB ] );

		expect( wrapped ).toHaveLength( 2 );
		expect( wrapped[ 0 ] ).not.toBe( creatorA );
		expect( wrapped[ 1 ] ).not.toBe( creatorB );
	} );
} );
