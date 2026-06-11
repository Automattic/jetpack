import { jest } from '@jest/globals';

const mockRecordEvent = jest.fn();
const mockGetCurrentPostId = jest.fn( (): number | undefined => 42 );
const mockGetCurrentPostType = jest.fn( (): string | undefined => 'post' );
const mockGetCurrentUser = jest.fn( (): { id?: number } | undefined => ( { id: 99 } ) );

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent } },
} ) );

jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: () => ( {
		getCurrentPostId: mockGetCurrentPostId,
		getCurrentPostType: mockGetCurrentPostType,
		getCurrentUser: mockGetCurrentUser,
	} ),
} ) );

const { getTransport, recordRtcEvent } = await import( '../tracks' );

const recordEvent = mockRecordEvent as jest.Mock;

describe( 'getTransport', () => {
	afterEach( () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;
	} );

	it( 'returns "pinghub" when the pinghub provider is configured', () => {
		( window as Record< string, unknown > ).jetpackRTC = { providers: [ 'pinghub' ] };
		expect( getTransport() ).toBe( 'pinghub' );
	} );

	it( 'returns "http-polling" when pinghub is not in the providers list', () => {
		( window as Record< string, unknown > ).jetpackRTC = { providers: [ 'http-polling' ] };
		expect( getTransport() ).toBe( 'http-polling' );
	} );

	it( 'returns "http-polling" when jetpackRTC is absent', () => {
		expect( getTransport() ).toBe( 'http-polling' );
	} );
} );

describe( 'recordRtcEvent', () => {
	beforeEach( () => {
		recordEvent.mockClear();
		( window as Record< string, unknown > ).jetpackRTC = { providers: [ 'pinghub' ] };
	} );

	afterEach( () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;
	} );

	it( 'merges transport and editor post context into the event properties', () => {
		recordRtcEvent( 'jetpack_rtc_join', { contributor_count: 2 } );

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			transport: 'pinghub',
			wp_user_id: 99,
			post_id: 42,
			post_type: 'post',
			contributor_count: 2,
		} );
	} );

	it( 'reads post context from the editor store on http-polling (no window.jetpackRTC)', () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;

		recordRtcEvent( 'jetpack_rtc_join', { contributor_count: 1 } );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			transport: 'http-polling',
			wp_user_id: 99,
			post_id: 42,
			post_type: 'post',
			contributor_count: 1,
		} );
	} );

	it( 'includes the current user WP id as wp_user_id', () => {
		recordRtcEvent( 'jetpack_rtc_join' );

		expect( recordEvent.mock.calls[ 0 ][ 1 ] ).toMatchObject( { wp_user_id: 99 } );
	} );

	it( 'does not set blog_id (left to jpTracksContext)', () => {
		recordRtcEvent( 'jetpack_rtc_join' );

		const props = recordEvent.mock.calls[ 0 ][ 1 ];
		expect( props ).not.toHaveProperty( 'blog_id' );
	} );

	it( 'never throws when analytics throws', () => {
		recordEvent.mockImplementationOnce( () => {
			throw new Error( 'tracks unavailable' );
		} );
		expect( () => recordRtcEvent( 'jetpack_rtc_join' ) ).not.toThrow();
	} );
} );
