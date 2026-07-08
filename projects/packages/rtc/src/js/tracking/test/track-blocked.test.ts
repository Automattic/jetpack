import { jest } from '@jest/globals';

const recordRtcEventMock = jest.fn();

jest.unstable_mockModule( '../tracks', () => ( {
	recordRtcEvent: recordRtcEventMock,
} ) );

const { recordBlocked } = await import( '../track-blocked' );

type StateSpec = Record< number, number | null >;

/**
 * Build a minimal awareness stub for testing.
 *
 * @param spec     - Map of clientID → wp_user_id (null means no id field).
 * @param clientID - The local client's ID.
 * @return A minimal awareness-like object.
 */
function fakeAwareness( spec: StateSpec, clientID: number ) {
	const states = new Map< number, { collaboratorInfo?: { id?: number } } >();
	for ( const key of Object.keys( spec ) ) {
		const id = spec[ Number( key ) ];
		states.set( Number( key ), { collaboratorInfo: id === null ? {} : { id } } );
	}
	return { clientID, getStates: () => states };
}

describe( 'recordBlocked', () => {
	beforeEach( () => {
		recordRtcEventMock.mockClear();
		( window as Record< string, unknown > ).jetpackRtcNotices = {
			isAdmin: false,
			isPlanOwner: true,
		};
	} );

	afterEach( () => {
		delete ( window as Record< string, unknown > ).jetpackRtcNotices;
	} );

	it( 'records jetpack_rtc_blocked with the room occupants (excluding the blocked local client) and role flags', () => {
		// clientID 3 (user 9) is the local client being turned away; users 7 and 8
		// hold the room. The blocked user is reported via wp_user_id (added by the
		// mocked recordRtcEvent), not in contributors.
		const awareness = fakeAwareness( { 1: 7, 2: 8, 3: 9 }, 3 );

		recordBlocked( awareness as never );

		expect( recordRtcEventMock ).toHaveBeenCalledTimes( 1 );
		expect( recordRtcEventMock ).toHaveBeenCalledWith( 'jetpack_rtc_blocked', {
			contributor_count: 2,
			contributors: [ 7, 8 ],
			is_admin: false,
			is_plan_owner: true,
		} );
	} );

	it( 'defaults the role flags to false when no notices config is present', () => {
		delete ( window as Record< string, unknown > ).jetpackRtcNotices;
		const awareness = fakeAwareness( { 1: 7, 2: 8, 3: 9 }, 3 );

		recordBlocked( awareness as never );

		const props = recordRtcEventMock.mock.calls[ 0 ][ 1 ];
		expect( props ).toMatchObject( { is_admin: false, is_plan_owner: false } );
	} );
} );
