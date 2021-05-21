import config from 'config';

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
import ThankYouPage from '../lib/pages/wpcom/thank-you';
import MyPlanPage from '../lib/pages/wpcom/my-plan';
import PickAPlanPage from '../lib/pages/wpcom/pick-a-plan';
import CheckoutPage from '../lib/pages/wpcom/checkout';

// Disable pre-connect for this test suite
process.env.SKIP_CONNECT = true;

const cookie = config.get( 'storeSandboxCookieValue' );
const cardCredentials = config.get( 'testCardCredentials' );

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
			await jetpackPage.openDashboard();
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

	it( 'In-place upgrading a plan from Security Daily to Complete', async () => {
		await step( 'Can set a sandbox cookie', async () => {
			const sidebar = await Sidebar.init( page );
			await sidebar.setSandboxModeForPayments( cookie );
			await sidebar.setSandboxModeForPayments( cookie, '.cloud.jetpack.com' );
			await sidebar.setSandboxModeForPayments( cookie, '.' + new URL( siteUrl ).host );
		} );

		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection( 'security' );
		} );

		await step( 'Can process payment for Security Daily plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
		} );

		await step( 'Can assert that site has a Security Daily plan', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isPlan( 'security' ) ).toBeTruthy();
		} );

		await step( 'Can visit plans page and select a Complete plan', async () => {
			await ( await JetpackPage.init( page ) ).openPlans();
			await ( await PickAPlanPage.init( page ) ).select( 'complete' );
		} );

		await step( 'Can process payment for Complete plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
		} );

		await step( 'Can assert that site has a Complete plan', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isPlan( 'complete' ) ).toBeTruthy();
		} );
	} );
} );
