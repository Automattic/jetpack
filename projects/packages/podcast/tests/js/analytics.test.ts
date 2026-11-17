import jetpackAnalytics from '@automattic/jetpack-analytics';
import { recordDashboardView } from '../../src/dashboard/analytics';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		assignSuperProps: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {} ),
	getSiteData: () => ( {} ),
} ) );

const VIEW = {
	view: 'stats',
	is_set_up: true,
	settings_missing: 0,
	has_product_access: true,
	is_connected: true,
};
const shown = ( page: string, firstShow: boolean ) =>
	window.dispatchEvent(
		new CustomEvent( 'jetpack-admin-shell:page-shown', { detail: { page, firstShow } } )
	);

it( 'records the view once per page load, and again each time the admin shell shows the dashboard again', () => {
	recordDashboardView( { ...VIEW, view: 'welcome' } )();
	const stop = recordDashboardView( VIEW );

	shown( 'jetpack-podcast', true );
	shown( 'my-jetpack', false );
	shown( 'jetpack-podcast', false );
	stop();
	shown( 'jetpack-podcast', false );

	expect( ( jetpackAnalytics.tracks.recordEvent as jest.Mock ).mock.calls ).toEqual( [
		[ 'jetpack_podcast_dashboard_viewed', { ...VIEW, view: 'welcome' } ],
		[ 'jetpack_podcast_dashboard_viewed', VIEW ],
	] );
} );
