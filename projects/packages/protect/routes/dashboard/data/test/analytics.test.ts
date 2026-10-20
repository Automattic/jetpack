import jetpackAnalytics from '@automattic/jetpack-analytics';
import { recordEvent, resetAnalyticsForTesting } from '../analytics';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

const mockInitialize = jetpackAnalytics.initialize as jest.Mock;
const mockRecord = jetpackAnalytics.tracks.recordEvent as jest.Mock;

describe( 'recordEvent', () => {
	beforeEach( () => {
		resetAnalyticsForTesting();
		mockInitialize.mockReset();
		mockRecord.mockReset();
		delete window.JP_CONNECTION_INITIAL_STATE;
		window.jetpackProtectTracks = true;
	} );

	it.each( [
		[ 'identifies the connected user once', { ID: 7, login: 'reader' }, [ [ 7, 'reader' ] ] ],
		[ 'records anonymously without a connected user', undefined, [] ],
	] )( '%s', ( _, wpcomUser, identified ) => {
		window.JP_CONNECTION_INITIAL_STATE = {
			userConnectionData: { currentUser: { wpcomUser } },
		};

		recordEvent( 'jetpack_scan_scan_now' );
		recordEvent( 'jetpack_protect_waf_enabled', { a: 1 } );

		expect( mockInitialize.mock.calls ).toEqual( identified );
		expect( mockRecord.mock.calls ).toEqual( [
			[ 'jetpack_scan_scan_now', undefined ],
			[ 'jetpack_protect_waf_enabled', { a: 1 } ],
		] );
	} );

	it( 'records nothing when PHP didn’t allow Tracks', () => {
		window.jetpackProtectTracks = undefined;

		recordEvent( 'jetpack_scan_scan_now' );

		expect( mockRecord ).not.toHaveBeenCalled();
	} );
} );
