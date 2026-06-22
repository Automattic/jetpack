import { jest } from '@jest/globals';

const mockRecordEvent = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent } },
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
		( window as Record< string, unknown > ).jetpackRtcNotices = {
			postId: 42,
			postType: 'post',
			userId: 99,
		};
	} );

	afterEach( () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;
		delete ( window as Record< string, unknown > ).jetpackRtcNotices;
	} );

	it( 'merges transport, post context, and user id from the server config', () => {
		recordRtcEvent( 'jetpack_rtc_join', { contributor_count: 2 } );

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			transport: 'pinghub',
			post_id: 42,
			post_type: 'post',
			wp_user_id: 99,
			contributor_count: 2,
		} );
	} );

	it( 'still resolves post/user context on http-polling (no window.jetpackRTC)', () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;

		recordRtcEvent( 'jetpack_rtc_join', { contributor_count: 1 } );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			transport: 'http-polling',
			post_id: 42,
			post_type: 'post',
			wp_user_id: 99,
			contributor_count: 1,
		} );
	} );

	it( 'omits context fields that are not set, rather than sending null/undefined', () => {
		( window as Record< string, unknown > ).jetpackRtcNotices = { postId: 42, userId: 99 };

		recordRtcEvent( 'jetpack_rtc_join' );

		const props = recordEvent.mock.calls[ 0 ][ 1 ];
		expect( props ).not.toHaveProperty( 'post_type' );
		expect( props ).toMatchObject( { post_id: 42, wp_user_id: 99 } );
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
