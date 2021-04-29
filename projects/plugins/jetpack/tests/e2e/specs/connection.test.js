import { step } from '../lib/env/test-setup';
import {
	doInPlaceConnection,
	doUserlessConnection,
	loginToWpComIfNeeded,
	loginToWpSite,
	doClassicConnection,
} from '../lib/flows/jetpack-connect';
import { resetWordpressInstall, execShellCommand, resolveSiteUrl } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import MePage from '../lib/pages/wpcom/me';

// Disable pre-connect for this test suite
process.env.SKIP_CONNECT = true;

/**
 *
 * @group connection
 */
describe( 'Connection', () => {
	afterEach( async () => {
		await execShellCommand( 'yarn tunnel-reset' );
		global.siteUrl = resolveSiteUrl();
		await resetWordpressInstall();
		await loginToWpComIfNeeded( 'defaultUser', true );
		await loginToWpSite( true );
	} );

	it( 'In-place', async () => {
		await step( 'Can start in-place connection', async () => {
			await DashboardPage.visit( page );
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'User-less', async () => {
		await step( 'Can log out from WPCOM', async () => {
			await ( await MePage.visit( page ) ).logOut();
		} );

		await step( 'Can start Userless connection', async () => {
			await DashboardPage.visit( page );
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doUserlessConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'Classic', async () => {
		await step( 'Can start classic connection', async () => {
			await DashboardPage.visit( page );
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doClassicConnection( true );
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );
} );
