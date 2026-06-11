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
		( window as Record< string, unknown > ).jetpackRTC = {
			providers: [ 'pinghub' ],
			currentPostId: 42,
			currentPostType: 'post',
		};
	} );

	afterEach( () => {
		delete ( window as Record< string, unknown > ).jetpackRTC;
	} );

	it( 'merges transport and post context into the event properties', () => {
		recordRtcEvent( 'jetpack_rtc_join', { contributor_count: 2 } );

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_rtc_join', {
			transport: 'pinghub',
			post_id: 42,
			post_type: 'post',
			contributor_count: 2,
		} );
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
