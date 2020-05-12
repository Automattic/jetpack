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
import PickAPlanPage from '../pages/wpcom/pick-a-plan';
import WPLoginPage from '../pages/wp-admin/login';
import CheckoutPage from '../pages/wpcom/checkout';
import ThankYouPage from '../pages/wpcom/thank-you';
import MyPlanPage from '../pages/wpcom/my-plan';
import {
	getNgrokSiteUrl,
	provisionJetpackStartConnection,
	execShellCommand,
	execWpCommand,
} from '../utils-helper';
import PlansPage from '../pages/wpcom/plans';
import { persistPlanData, syncPlanData } from '../plan-helper';
import logger from '../logger';
import InPlaceAuthorizeFrame from '../pages/wp-admin/in-place-authorize';

const cookie = config.get( 'storeSandboxCookieValue' );
const cardCredentials = config.get( 'testCardCredentials' );

/**
 * Connects your site to WPCOM as `wpcomUser`, buys a Professional plan via sandbox cookie
 *
 * @param {Object} o Optional object with params such as `wpcomUser` and expected Jetpack plan
 * @param {string} o.wpcomUser
 * @param {string} o.plan
 * @param {boolean} o.mockPlanData
 */
export async function connectThroughWPAdminIfNeeded( {
	wpcomUser = 'defaultUser',
	plan = 'pro',
	mockPlanData = false,
} = {} ) {
	await loginToWpcomIfNeeded( wpcomUser, mockPlanData );

	await loginToWpSite( mockPlanData );

	if ( await isBlogTokenSet() ) {
		return 'already_connected';
	}

	await ( await Sidebar.init( page ) ).selectJetpack();

	const jetpackPage = await JetpackPage.init( page );
	if ( await jetpackPage.isConnected() ) {
		await jetpackPage.openMyPlan();
		if ( await jetpackPage.isPlan( plan ) ) {
			// eslint-disable-next-line no-console
			logger.info( 'Site is already connected and has a plan!' );
			return true;
		}
	}

	await doClassicConnection( mockPlanData );
	await syncJetpackPlanData( plan, mockPlanData );
}

async function doClassicConnection( mockPlanData ) {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.connect();
	// Go through Jetpack connect flow
	await ( await AuthorizePage.init( page ) ).approve();
	if ( mockPlanData ) {
		await ( await PickAPlanPage.init( page ) ).selectFreePlan();
	} else {
		await ( await PickAPlanPage.init( page ) ).selectBusinessPlan();
		await ( await CheckoutPage.init( page ) ).processPurchase( cardCredentials );
	}
	await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
	await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
}

export async function doInPlaceConnection() {
	const jetpackPage = await JetpackPage.init( page );
	await jetpackPage.connect();

	await ( await InPlaceAuthorizeFrame.init( page ) ).approve();
	await ( await PickAPlanPage.init( page ) ).selectFreePlan();
	await ( await ThankYouPage.init( page ) ).waitForSetupAndProceed();
	await ( await MyPlanPage.init( page ) ).returnToWPAdmin();
	await ( await Sidebar.init( page ) ).selectJetpack();
}

export async function syncJetpackPlanData( plan, mockPlanData = true ) {
	if ( mockPlanData ) {
		const planType = plan === 'free' ? 'jetpack_free' : 'jetpack_business';
		await persistPlanData( planType );
	}

	const siteUrl = getNgrokSiteUrl();
	const jetpackUrl = siteUrl + '/wp-admin/admin.php?page=jetpack#/dashboard';

	const jetpackPage = await JetpackPage.visit( page, jetpackUrl );
	await jetpackPage.openMyPlan();
	await jetpackPage.reload( { waitFor: 'networkidle0' } );

	if ( ! mockPlanData ) {
		await jetpackPage.reload( { waitFor: 'networkidle0' } );
		await page.waitForResponse(
			response => response.url().match( /v4\/site[^\/]/ ) && response.status() === 200,
			{ timeout: 60 * 1000 }
		);
		await execWpCommand( 'wp cron event run jetpack_v2_heartbeat' );
	}
	await syncPlanData( page );
	if ( ! ( await jetpackPage.isPlan( plan ) ) ) {
		throw new Error( `Site does not have ${ plan } plan` );
	}
}

export async function loginToWpSite( mockPlanData ) {
	const siteUrl = getNgrokSiteUrl();
	if ( ! siteUrl ) {
		throw 'WOW, siteURL is empty!';
	}
	const host = new URL( siteUrl ).host;
	await ( await WPLoginPage.visit( page, siteUrl + '/wp-login.php' ) ).login();
	if ( ! mockPlanData ) {
		await ( await DashboardPage.init( page ) ).setSandboxModeForPayments( cookie, host );
	}
}

export async function loginToWpcomIfNeeded( wpcomUser, mockPlanData ) {
	// Logs in to WPCOM
	const login = await LoginPage.visit( page );
	if ( ! mockPlanData ) {
		await login.setSandboxModeForPayments( cookie );
	}
	if ( ! ( await login.isLoggedIn() ) ) {
		await login.login( wpcomUser );
	}
}

async function isBlogTokenSet() {
	const cliCmd = 'wp jetpack options get blog_token';
	const result = await execWpCommand( cliCmd );

	if ( typeof result === 'object' && result.code === 1 ) {
		return false;
	}

	return true;
}

export async function connectThroughJetpackStart( {
	wpcomUser = 'defaultUser',
	plan = 'pro',
} = {} ) {
	// remove Sandbox cookie
	await page.deleteCookie( {
		name: 'store_sandbox',
		domain: '.wordpress.com',
	} );

	// Logs in to WPCOM
	const login = await LoginPage.visit( page );
	if ( ! ( await login.isLoggedIn() ) ) {
		await login.login( wpcomUser );
	}

	const nextUrl = provisionJetpackStartConnection();
	// sometimes after clicking on Approve button below user being redirected to wp-login page
	// maybe waiting for a bit will help?
	await page.waitFor( 10000 );

	await ( await AuthorizePage.visit( page, nextUrl ) ).approve();
	await ( await PlansPage.init( page ) ).isCurrentPlan( 'business' );

	const siteUrl = getNgrokSiteUrl();

	await ( await WPLoginPage.visit( page, siteUrl + '/wp-login.php' ) ).login();
	await ( await Sidebar.init( page ) ).selectJetpack();

	const jetpackPage = await JetpackPage.init( page );

	await jetpackPage.openMyPlan();

	await page.waitForResponse(
		response => response.url().match( /v4\/site[^\/]/ ) && response.status() === 200,
		{ timeout: 60 * 1000 }
	);

	await jetpackPage.reload( { waitFor: 'networkidle0' } );

	await execShellCommand(
		'wp cron event run jetpack_v2_heartbeat --path="/home/travis/wordpress"'
	);

	if ( ! ( await jetpackPage.isPlan( plan ) ) ) {
		throw new Error( `Site does not have ${ plan } plan` );
	}

	return true;
}
