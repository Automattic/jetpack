/**
 * External dependencies
 */
import config from 'config';
/**
 * Internal dependencies
 */
import { step } from '../lib/setup-env';
import {
	doInPlaceConnection,
	syncJetpackPlanData,
	loginToWpSite,
	loginToWpcomIfNeeded,
} from '../lib/flows/jetpack-connect';
import { execWpCommand, getNgrokSiteUrl, resetWordpressInstall } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import CheckoutPage from '../lib/pages/wpcom/checkout';
import ThankYouPage from '../lib/pages/wpcom/thank-you';
import MyPlanPage from '../lib/pages/wpcom/my-plan';
import PlansPage from '../lib/pages/wp-admin/plans';
const cookie = config.get( 'storeSandboxCookieValue' );
const cardCredentials = config.get( 'testCardCredentials' );

describe( 'Connection', () => {
	beforeEach( async () => {
		await resetWordpressInstall();
		await execWpCommand( 'wp config set --raw JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME false' );
		await execWpCommand( 'wp plugin deactivate e2e-plan-data-interceptor' );

		await loginToWpcomIfNeeded( 'defaultUser' );
		await loginToWpSite();
	} );

	afterAll( async () => {
		await resetWordpressInstall();
	} );

	it( 'In-place with Free plan', async () => {
		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );

	it( 'In-place upgrading a plan from premium to professional', async () => {
		await step( 'Can set a sandbox cookie', async () => {
			const siteUrl = getNgrokSiteUrl();
			const host = '.' + new URL( siteUrl ).host;
			const sidebar = await Sidebar.init( page );
			await sidebar.setSandboxModeForPayments( cookie );
			await sidebar.setSandboxModeForPayments( cookie, host );
		} );

		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection( 'premium' );
		} );

		await step( 'Can process payment for Premium plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			const myPlanPage = await MyPlanPage.init( page );
			// NOTE: it is a workaround for a some sort of race condition in plan upgrade flow, when the new plan is associated to a different blogID.
			// await myPlanPage.reload( { waitFor: 'networkidle0' } );
			// await myPlanPage.reload( { waitFor: 'networkidle0' } );
			// await myPlanPage.reload( { waitFor: 'networkidle0' } );

			await myPlanPage.returnToWPAdmin();
			await syncJetpackPlanData( 'premium', false );
		} );

		await step( 'Can assert that site has a Premium plan', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isPlan( 'premium' ) ).toBeTruthy();
		} );

		await step( 'Can re-login to WP admin', async () => {
			await ( await Sidebar.init( page ) ).logout();
			await loginToWpSite();
			await ( await Sidebar.init( page ) ).selectJetpack();
		} );

		await step( 'Can visit plans page and select a Professional plan', async () => {
			const jetpackPage = await JetpackPage.init( page );

			await jetpackPage.openPlans();
			const plansPage = await PlansPage.init( page );
			await plansPage.select( 'pro' );
		} );

		await step( 'Can process payment for Professional plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();

			await syncJetpackPlanData( 'pro', false );
		} );

		await step( 'Can assert that site has a Professional plan', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isPlan( 'pro' ) ).toBeTruthy();
		} );
	} );
} );
