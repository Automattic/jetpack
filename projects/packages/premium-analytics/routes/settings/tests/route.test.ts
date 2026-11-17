import { getScriptData } from '@automattic/jetpack-script-data';
import { ensureCoreSettingsReady } from '@jetpack-premium-analytics/data';
import { isPremiumAnalyticsSiteConnected } from '../../site-readiness';
import { route } from '../route';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn( () => ( {
		premium_analytics: { stats_settings: { roles: [], features_url: null } },
	} ) ),
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
} ) );

jest.mock( '../../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

describe( 'settings route.beforeLoad', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'opens for a user the site hands its Stats settings to, starting the settings request', () => {
		expect( () => route.beforeLoad() ).not.toThrow();
		expect( ensureCoreSettingsReady ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'redirects to /connect when the site is not connected', () => {
		jest.mocked( isPremiumAnalyticsSiteConnected ).mockReturnValueOnce( false );

		expect( () => route.beforeLoad() ).toThrow( expect.objectContaining( { to: '/connect' } ) );
	} );

	it( 'redirects a user without the Stats settings to the dashboard', () => {
		jest.mocked( getScriptData ).mockReturnValueOnce( {} as ReturnType< typeof getScriptData > );

		expect( () => route.beforeLoad() ).toThrow( expect.objectContaining( { to: '/' } ) );
		expect( ensureCoreSettingsReady ).not.toHaveBeenCalled();
	} );
} );
