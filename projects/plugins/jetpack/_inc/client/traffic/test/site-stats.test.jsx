import { jest } from '@jest/globals';
import rootReducer from 'state/reducer';
import { render, screen } from 'test/test-utils';
import { SiteStats } from '../site-stats';

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: new Proxy( {}, { get: () => () => Promise.resolve( {} ) } ),
} ) );

const LINK_NAME = 'Manage Stats settings';

/**
 * State for a connected site with the Stats module on.
 *
 * @param {object}  _                       - Options.
 * @param {boolean} _.isOdysseyStatsEnabled - Whether the site uses the Stats dashboard.
 * @return {object} Initial redux state.
 */
function buildInitialState( { isOdysseyStatsEnabled } ) {
	return {
		jetpack: {
			connection: {
				status: { siteConnected: { isActive: true, offlineMode: { isActive: false } } },
				user: { currentUser: { isConnected: true } },
				requests: {},
			},
			initialState: {
				userData: { currentUser: { permissions: { manage_modules: true } } },
				isOdysseyStatsEnabled,
				stats: { roles: { administrator: { name: 'Administrator' }, editor: { name: 'Editor' } } },
			},
			modules: { items: { stats: { module: 'stats', name: 'Jetpack Stats', activated: true } } },
			settings: {
				items: { stats: true, admin_bar: true, count_roles: [], roles: [ 'administrator' ] },
			},
		},
	};
}

const getModule = () => ( { module: 'stats', name: 'Jetpack Stats' } );
const getModuleOverride = () => false;
const isOnline = () => false;
const isOffline = () => true;

/**
 * Render the Stats card as the Traffic page does.
 *
 * @param {object}  _                       - Options.
 * @param {boolean} _.isOdysseyStatsEnabled - Whether the site uses the Stats dashboard.
 * @param {boolean} _.offline               - Whether Stats is unavailable in offline mode.
 */
function renderSiteStats( { isOdysseyStatsEnabled, offline = false } ) {
	render(
		<SiteStats
			getModule={ getModule }
			getModuleOverride={ getModuleOverride }
			isUnavailableInOfflineMode={ offline ? isOffline : isOnline }
		/>,
		{ initialState: buildInitialState( { isOdysseyStatsEnabled } ), reducer: rootReducer }
	);
}

describe( 'SiteStats', () => {
	it( 'links to the Stats dashboard settings when the site uses the Stats dashboard', () => {
		renderSiteStats( { isOdysseyStatsEnabled: true } );

		expect( screen.getByRole( 'link', { name: LINK_NAME } ) ).toHaveAttribute(
			'href',
			'admin.php?page=stats#!/stats/settings'
		);
	} );

	it( 'keeps the settings on this page when the site uses the old Stats page', () => {
		renderSiteStats( { isOdysseyStatsEnabled: false } );

		expect( screen.queryByRole( 'link', { name: LINK_NAME } ) ).not.toBeInTheDocument();
		expect( screen.getByText( /Expand to update settings/ ) ).toBeInTheDocument();
	} );

	it( 'hides the Stats settings link in offline mode', () => {
		renderSiteStats( { isOdysseyStatsEnabled: true, offline: true } );

		expect( screen.queryByRole( 'link', { name: LINK_NAME } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Unavailable in Offline Mode' ) ).toBeInTheDocument();
	} );
} );
