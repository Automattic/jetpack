import { step } from '../lib/env/test-setup';
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
		await step( 'Can start in-place connection', async () => {
			await doInPlaceConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'User-less', async () => {
		await step( 'Can clean up WPCOM cookie', async () => {
			await ( await Sidebar.init( page ) ).removeCookieByName( 'wordpress_logged_in' );
		} );

		await step( 'Can start Site Level connection', async () => {
			await doSiteLevelConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'Classic', async () => {
		await step( 'Can start classic connection', async () => {
			await doClassicConnection( true );
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );
} );
