import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { route } from './route';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn( () => false ),
} ) );

jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

describe( 'upgrade route.beforeLoad', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'opens on a connected Jetpack site', () => {
		expect( () => route.beforeLoad() ).not.toThrow();
	} );

	it( 'redirects to /connect when the site is not connected', () => {
		jest.mocked( isPremiumAnalyticsSiteConnected ).mockReturnValueOnce( false );

		expect( () => route.beforeLoad() ).toThrow( expect.objectContaining( { to: '/connect' } ) );
	} );

	it( 'redirects a WordPress.com site, which upgrades its plan instead, to the dashboard', () => {
		jest.mocked( isWpcomPlatformSite ).mockReturnValueOnce( true );

		expect( () => route.beforeLoad() ).toThrow( expect.objectContaining( { to: '/' } ) );
	} );
} );
