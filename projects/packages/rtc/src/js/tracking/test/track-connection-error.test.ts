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

const { withConnectionErrorTracking, registerConnectionErrorTracking } = await import(
	'../track-connection-error'
);

type StatusListener = ( status: unknown ) => void;

/**
 * Build a fake provider whose `on('status')` listeners can be fired by the test
 * via the returned `emitStatus()` helper, and whose `destroy` is observable.
 *
 * @return A fake provider result plus an `emitStatus` trigger.
 */
function makeProvider() {
	const listeners: StatusListener[] = [];
	return {
		destroy: jest.fn(),
		on: ( event: string, cb: StatusListener ) => {
			if ( event === 'status' ) {
				listeners.push( cb );
			}
		},
		emitStatus: ( status: unknown ) => listeners.forEach( cb => cb( status ) ),
	};
}

const entityRoom = {
	objectType: 'postType',
	objectId: 'post-42',
	ydoc: {} as never,
};

describe( 'withConnectionErrorTracking', () => {
	beforeEach( () => {
		recordRtcEventMock.mockClear();
		isRoomLimitBreachedMock.mockReturnValue( false );
	} );

	it( 'records jetpack_rtc_connection_error on a bare disconnect (no error, e.g. PingHub)', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( entityRoom as never );
		provider.emitStatus( { status: 'disconnected' } );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_connection_error', {
			error_code: undefined,
		} );
	} );

	it( 'includes the error code when the transport supplies one', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( entityRoom as never );
		provider.emitStatus( { status: 'disconnected', error: { code: 'authentication-failed' } } );

		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_connection_error', {
			error_code: 'authentication-failed',
		} );
	} );

	it( 'does not record connected or connecting statuses', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( entityRoom as never );
		provider.emitStatus( { status: 'connecting' } );
		provider.emitStatus( { status: 'connected' } );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'does not record a disconnect emitted during teardown', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		const result = await wrapped( entityRoom as never );
		// Navigating away / switching posts tears the provider down, which emits
		// 'disconnected' synchronously — that must not count as a connection error.
		( result as { destroy: () => void } ).destroy();
		provider.emitStatus( { status: 'disconnected' } );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
		expect( provider.destroy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'skips the per-room-limit case (connection-limit-exceeded code)', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( entityRoom as never );
		provider.emitStatus( {
			status: 'disconnected',
			error: { code: 'connection-limit-exceeded' },
		} );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'skips when the room limit has been breached, whatever the error code', async () => {
		isRoomLimitBreachedMock.mockReturnValue( true );
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( entityRoom as never );
		provider.emitStatus( { status: 'disconnected' } );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'records only once even if the connection keeps dropping', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( entityRoom as never );
		provider.emitStatus( { status: 'disconnected' } );
		provider.emitStatus( { status: 'connecting' } );
		provider.emitStatus( { status: 'disconnected', error: { code: 'unknown-error' } } );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not subscribe for a collection room (objectId === null)', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		await wrapped( { ...entityRoom, objectId: null } as never );
		provider.emitStatus( { status: 'disconnected' } );

		expect( recordRtcEventMock ).not.toHaveBeenCalled();
	} );

	it( 'forwards destroy to the inner provider', async () => {
		const provider = makeProvider();
		const creator = jest.fn().mockResolvedValue( provider );
		const wrapped = withConnectionErrorTracking( creator as never );

		const result = await wrapped( entityRoom as never );
		( result as { destroy: () => void } ).destroy();

		expect( provider.destroy ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'registerConnectionErrorTracking', () => {
	beforeEach( () => addFilterMock.mockClear() );

	it( 'registers a sync.providers filter at priority 30', () => {
		registerConnectionErrorTracking();

		expect( addFilterMock ).toHaveBeenCalledWith(
			'sync.providers',
			'jetpack/rtc-connection-error-tracking',
			expect.any( Function ),
			30
		);
	} );

	it( 'wraps each provider creator with connection-error tracking', () => {
		registerConnectionErrorTracking();

		const mapper = addFilterMock.mock.calls[ 0 ][ 2 ] as ( p: unknown[] ) => unknown[];
		const creatorA = jest.fn();
		const creatorB = jest.fn();
		const wrapped = mapper( [ creatorA, creatorB ] );

		expect( wrapped ).toHaveLength( 2 );
		expect( wrapped[ 0 ] ).not.toBe( creatorA );
		expect( wrapped[ 1 ] ).not.toBe( creatorB );
	} );
} );
