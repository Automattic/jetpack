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

	it( 'In-place upgrading a plan from personal to premium', async () => {
		await step( 'Can set a sandbox cookie', async () => {
			const siteUrl = getNgrokSiteUrl();
			const host = '.' + new URL( siteUrl ).host;
			const sidebar = await Sidebar.init( page );
			await sidebar.setSandboxModeForPayments( cookie );
			await sidebar.setSandboxModeForPayments( cookie, host );
		} );

		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection( 'personal' );
		} );

		await step( 'Can process payment for Personal plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			const p = await MyPlanPage.init( page );
			p.reload( { waitFor: 'networkidle0' } );
			p.reload( { waitFor: 'networkidle0' } );
			p.reload( { waitFor: 'networkidle0' } );

			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
			await syncJetpackPlanData( 'personal', false );
		} );

		await step( 'Can assert that site has a Personal plan', async () => {
			const jetpackPage = await JetpackPage.init( page );

			const blogToken = await execWpCommand( 'wp jetpack options get blog_token' );
			const blogId = await execWpCommand( 'wp jetpack options get id' );
			console.log( '!!!!!!1', blogToken, blogId );

			expect( await jetpackPage.isPlan( 'personal' ) ).toBeTruthy();
		} );

		await step( 'Can visit plans page and select a Premium plan', async () => {
			const jetpackPage = await JetpackPage.init( page );

			await jetpackPage.openPlans();
			const plansPage = await PlansPage.init( page );
			await plansPage.select( 'premium' );

			const blogToken = await execWpCommand( 'wp jetpack options get blog_token' );
			const blogId = await execWpCommand( 'wp jetpack options get id' );
			console.log( '!!!!!!2', blogToken, blogId );
		} );

		await step( 'Can process payment for Premium plan', async () => {
			await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
			await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
			await ( await MyPlanPage.init( page ) ).returnToWPAdmin();

			let blogToken = await execWpCommand( 'wp jetpack options get blog_token' );
			let blogId = await execWpCommand( 'wp jetpack options get id' );
			console.log( '!!!!!!3', blogToken, blogId );

			await syncJetpackPlanData( 'premium', false );

			blogToken = await execWpCommand( 'wp jetpack options get blog_token' );
			blogId = await execWpCommand( 'wp jetpack options get id' );
			console.log( '!!!!!!4', blogToken, blogId );
		} );

		await step( 'Can assert that site has a Premium plan', async () => {
			const jetpackPage = await JetpackPage.init( page );

			const blogToken = await execWpCommand( 'wp jetpack options get blog_token' );
			const blogId = await execWpCommand( 'wp jetpack options get id' );
			console.log( '!!!!!!5', blogToken, blogId );

			expect( await jetpackPage.isPlan( 'premium' ) ).toBeTruthy();
		} );
	} );
} );
