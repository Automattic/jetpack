import {
	doInPlaceConnection,
	doSiteLevelConnection,
	loginToWpComIfNeeded,
	loginToWpSite,
	doClassicConnection,
} from '../lib/flows/jetpack-connect';
import { resetWordpressInstall } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import { testStep } from '../lib/reporters/reporter';

// Disable pre-connect for this test suite
process.env.SKIP_CONNECT = true;

/**
 *
 * @group connection
 */
describe( 'Connection', () => {
	beforeEach( async () => {
		await loginToWpComIfNeeded( 'defaultUser', true );
		await loginToWpSite( true );
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpack();
	} );

	afterEach( async () => {
		await resetWordpressInstall();
	} );

	it( 'In-place', async () => {
		await testStep( 'Can start in-place connection', async () => {
			await doInPlaceConnection();
		} );

		await testStep( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'User-less', async () => {
		await testStep( 'Can clean up WPCOM cookie', async () => {
			await ( await Sidebar.init( page ) ).removeCookieByName( 'wordpress_logged_in' );
		} );

		await testStep( 'Can start Site Level connection', async () => {
			await doSiteLevelConnection();
		} );

		await testStep( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'Classic', async () => {
		await testStep( 'Can start classic connection', async () => {
			await doClassicConnection( true );
		} );

		await testStep( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );
} );
