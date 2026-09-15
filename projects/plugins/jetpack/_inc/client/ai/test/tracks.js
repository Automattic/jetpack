import { getSiteType } from '@automattic/jetpack-script-data';
import analytics from 'lib/analytics';
import { getTrackingSiteType, recordAiHubEvent } from '../tracks';

jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );
jest.mock( '@automattic/jetpack-script-data', () => ( { getSiteType: jest.fn() } ) );

afterEach( () => {
	jest.resetAllMocks();
	delete window.jetpackAiSettings;
} );

describe( 'getTrackingSiteType', () => {
	test.each( [
		[ 'simple', 'simple' ],
		[ 'woa', 'atomic' ],
		[ 'jetpack', 'jetpack' ],
	] )( 'maps script-data %s to %s', ( scriptData, expected ) => {
		getSiteType.mockReturnValue( scriptData );
		expect( getTrackingSiteType() ).toBe( expected );
	} );
} );

describe( 'recordAiHubEvent', () => {
	test( 'adds site_type and the audience props to every event and keeps the caller props', () => {
		getSiteType.mockReturnValue( 'woa' );
		window.jetpackAiSettings = { isA11n: true, isTest: false };
		recordAiHubEvent( 'jetpack_ai_hub_link_click', { link_type: 'video', link: 'x' } );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_hub_link_click', {
			site_type: 'atomic',
			is_a11n: 'true',
			is_test: 'false',
			link_type: 'video',
			link: 'x',
		} );
	} );

	test( 'audience props default to false strings when the page injects none', () => {
		getSiteType.mockReturnValue( 'jetpack' );
		recordAiHubEvent( 'jetpack_ai_hub_viewed', { tab: 'overview' } );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_hub_viewed', {
			site_type: 'jetpack',
			is_a11n: 'false',
			is_test: 'false',
			tab: 'overview',
		} );
	} );
} );
