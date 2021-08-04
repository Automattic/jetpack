import { step } from '../lib/env/test-setup';
import {
	doInPlaceConnection,
	doSiteLevelConnection,
	doClassicConnection,
} from '../lib/flows/jetpack-connect';
import { loginToWpSite, loginToWpCom } from '../lib/flows/log-in';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import { prerequisitesBuilder } from '../lib/env/prerequisites';

/**
 *
 * @group connection
 */
describe( 'Connection', () => {
	beforeEach( async () => {
		await prerequisitesBuilder().withConnection( false ).build();
		await loginToWpCom( 'defaultUser', true );
		await loginToWpSite( true );
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpack();
	} );

	afterEach( async () => {
		await prerequisitesBuilder().withCleanEnv().build();
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
