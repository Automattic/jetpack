import { jest } from '@jest/globals';

const recordRtcEventMock = jest.fn();
const addFilterMock = jest.fn();

jest.unstable_mockModule( '../tracks', () => ( {
	recordRtcEvent: recordRtcEventMock,
} ) );

jest.unstable_mockModule( '@wordpress/hooks', () => ( {
	addFilter: addFilterMock,
} ) );

const { withJoinTracking, registerJoinTracking } = await import( '../track-join' );

/**
 * Build a fake awareness whose getStates() returns states keyed by client id,
 * each carrying a collaboratorInfo.id (the WP user id).
 *
 * @param userIds - WP user IDs for each simulated client; undefined means no collaboratorInfo.id.
 * @return A fake awareness object with a getStates() method.
 */
function fakeAwareness( userIds: Array< number | undefined > ) {
	const states = new Map< number, { collaboratorInfo?: { id?: number } } >();
	userIds.forEach( ( id, index ) => {
		states.set( index, { collaboratorInfo: id === undefined ? {} : { id } } );
	} );
	return { getStates: () => states };
}

const makeProvider = () => ( { destroy: jest.fn(), on: jest.fn() } );

describe( 'withJoinTracking', () => {
	beforeEach( () => recordRtcEventMock.mockClear() );

	it( 'records a join with contributor ids for an entity room', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped( {
			objectType: 'postType',
			objectId: 'post-42',
			ydoc: {} as never,
			awareness: fakeAwareness( [ 7, 7, 9 ] ) as never,
		} );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			contributor_count: 3,
			contributors: [ 7, 7, 9 ],
		} );
	} );

	it( 'does not record for a collection room (objectId === null)', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped( {
			objectType: 'postType',
			objectId: null,
			ydoc: {} as never,
			awareness: fakeAwareness( [ 7 ] ) as never,
		} );

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

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'omits awareness states with no collaborator id', async () => {
		const creator = jest.fn().mockResolvedValue( makeProvider() );
		const wrapped = withJoinTracking( creator as never );

		await wrapped( {
			objectType: 'postType',
			objectId: 'post-42',
			ydoc: {} as never,
			awareness: fakeAwareness( [ 7, undefined, 9 ] ) as never,
		} );

		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			contributor_count: 2,
			contributors: [ 7, 9 ],
		} );
	} );

	it( 'returns the inner provider result', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withJoinTracking( creator as never );

		const result = await wrapped( {
			objectType: 'postType',
			objectId: 'post-42',
			ydoc: {} as never,
			awareness: fakeAwareness( [ 7 ] ) as never,
		} );

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
