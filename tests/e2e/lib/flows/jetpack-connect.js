/**
 * External dependencies
 */
import config from 'config';
/**
 * Internal dependencies
 */
import DashboardPage from '../pages/wp-admin/dashboard';
import Sidebar from '../pages/wp-admin/sidebar';
import JetpackPage from '../pages/wp-admin/jetpack';
import LoginPage from '../pages/wpcom/login';
import AuthorizePage from '../pages/wpcom/authorize';
import JetpackSiteTypePage from '../pages/jetpack-connect/site-type';
import JetpackSiteTopicPage from '../pages/jetpack-connect/site-topic';
import JetpackUserTypePage from '../pages/jetpack-connect/user-type';
import PickAPlanPage from '../pages/wpcom/pick-a-plan';
import HomePage from '../pages/wpcom/home';
import WPLoginPage from '../pages/wp-admin/login';
import CheckoutPage from '../pages/wpcom/checkout';
import ThankYouPage from '../pages/wpcom/thank-you';
import MyPlanPage from '../pages/wpcom/my-plan';

const cookie = config.get( 'storeSandboxCookieValue' );
const cardCredentials = config.get( 'testCardCredentials' );

/**
 * Connects your site to WPCOM as `wpcomUser`, buys a Professional plan via sandbox cookie
 * @param {Object} o Optional object with params such as `wpcomUser` and expected Jetpack plan
 */
export async function connectThroughWPAdminIfNeeded( {
	wpcomUser = 'defaultUser',
	plan = 'pro',
} = {} ) {
	await ( await HomePage.visit( page ) ).setSandboxModeForPayments( cookie );
	await ( await WPLoginPage.visit( page ) ).login();
	await ( await DashboardPage.init( page ) ).setSandboxModeForPayments( cookie, '.eu.ngrok.io' );
	await ( await Sidebar.init( page ) ).selectJetpack();

	const jetpackPage = await JetpackPage.init( page );
	if ( await jetpackPage.isConnected() ) {
		await jetpackPage.openMyPlan();
		if ( await jetpackPage.isPlan( plan ) ) {
			// eslint-disable-next-line no-console
			console.log( 'Site is already connected and has a plan!' );
			return true;
		}
	}

	await jetpackPage.connect();

	// Logs in to WPCOM
	await ( await LoginPage.init( page ) ).login( wpcomUser );

	// Go through Jetpack connect flow
	await ( await AuthorizePage.init( page ) ).approve();
	await ( await JetpackSiteTypePage.init( page ) ).selectSiteType( 'blog' );
	await ( await JetpackSiteTopicPage.init( page ) ).selectSiteTopic( 'test site' );
	await ( await JetpackUserTypePage.init( page ) ).selectUserType( 'creator' );

	await ( await PickAPlanPage.init( page ) ).selectBusinessPlan();
	await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );

	await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();

	await ( await MyPlanPage.init( page ) ).returnToWPAdmin();

	await ( await JetpackPage.init( page ) ).waitForPage();
}
