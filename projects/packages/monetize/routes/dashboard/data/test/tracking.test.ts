import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { trackClick } from '../tracking';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { getScriptData: jest.fn() } ) );

const recordEvent = jetpackAnalytics.tracks.recordEvent as jest.Mock;

/**
 * Print script data as the Jetpack plugin would.
 *
 * @param tracks - Whether the site and user allow Tracks.
 */
function mockScriptData( tracks: boolean ) {
	( getScriptData as jest.Mock ).mockReturnValue( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { wpcom: { ID: 7, login: 'owner' } } },
		monetize: { tracks },
	} );
}

describe( 'tracking', () => {
	beforeEach( () => recordEvent.mockClear() );

	it( 'records nothing when the site or user disallows Tracks', () => {
		mockScriptData( false );

		trackClick( 'view-earnings' );

		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records the site the event belongs to', () => {
		mockScriptData( true );

		trackClick( 'view-earnings' );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_click', {
			blog_id: 123,
			target: 'view-earnings',
			origin: 'monetize-settings-tab',
		} );
	} );
} );
