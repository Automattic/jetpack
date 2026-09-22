import { jest } from '@jest/globals';

// ESM test: mock the analytics module before importing the code under test, so
// the default-dispatch branch records against this spy rather than real Tracks.
const mockRecordEvent = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: mockRecordEvent }, initialize: jest.fn() },
} ) );

const { CONNECTION_ERROR_NOTICE_EVENTS, trackConnectionErrorNoticeEvent } =
	await import( '../tracking' );

describe( 'trackConnectionErrorNoticeEvent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'records straight to Tracks when no tracking callback is supplied', () => {
		trackConnectionErrorNoticeEvent( CONNECTION_ERROR_NOTICE_EVENTS.reconnect, {
			trackingContext: 'protect',
			error: { error_message: 'Broken', error_code: 'invalid_token', audience: 'site' },
		} );

		expect( mockRecordEvent ).toHaveBeenCalledWith( CONNECTION_ERROR_NOTICE_EVENTS.reconnect, {
			context: 'protect',
			error_code: 'invalid_token',
			audience: 'site',
		} );
	} );

	it( 'routes through the tracking callback when one is supplied, and not to Tracks', () => {
		const trackingCallback = jest.fn();

		trackConnectionErrorNoticeEvent( CONNECTION_ERROR_NOTICE_EVENTS.supportLink, {
			trackingCallback,
			trackingContext: 'my-jetpack',
			error: { error_message: 'Broken', error_code: 'xmlrpc_request_blocked', audience: 'owner' },
		} );

		expect( trackingCallback ).toHaveBeenCalledWith( CONNECTION_ERROR_NOTICE_EVENTS.supportLink, {
			context: 'my-jetpack',
			error_code: 'xmlrpc_request_blocked',
			audience: 'owner',
		} );
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'defaults context to null, audience to site, and drops a non-string code, then merges extra', () => {
		const trackingCallback = jest.fn();

		trackConnectionErrorNoticeEvent(
			CONNECTION_ERROR_NOTICE_EVENTS.noticeLink,
			{ trackingCallback },
			{ link_url: 'https://example.com/site-health' }
		);

		expect( trackingCallback ).toHaveBeenCalledWith( CONNECTION_ERROR_NOTICE_EVENTS.noticeLink, {
			context: null,
			error_code: null,
			audience: 'site',
			link_url: 'https://example.com/site-health',
		} );
	} );

	it( 'never throws when the dispatch target throws', () => {
		const trackingCallback = jest.fn( () => {
			throw new Error( 'tracks exploded' );
		} );

		expect( () =>
			trackConnectionErrorNoticeEvent( CONNECTION_ERROR_NOTICE_EVENTS.reconnect, {
				trackingCallback,
			} )
		).not.toThrow();
	} );
} );
