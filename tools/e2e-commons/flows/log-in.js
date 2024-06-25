import config from 'config';
import { resolveSiteUrl } from '../helpers/utils-helper.js';
import logger from '../logger.js';
import { DashboardPage, WPLoginPage } from '../pages/wp-admin/index.js';
import { LoginPage } from '../pages/wpcom/index.js';

const cookie = config.get( 'storeSandboxCookieValue' );

/**
 * Login to WordPress.com site
 *
 * @param {page} page - Playwright page instance.
 * @param {boolean} mockPlanData - Whether to mock plan data.
 */
export async function loginToWpSite( page, mockPlanData ) {
	// Navigating to login url will always display the login form even if the user is already logged in
	// To prevent unnecessary log in we navigate to Dashboard and check if logged in
	await DashboardPage.visit( page, false );

	if ( await DashboardPage.isDisplayed( page ) ) {
		logger.info( 'Already logged in' );
		return;
	}

	if ( await LoginPage.isDisplayed( page ) ) {
		logger.info( 'WPCOM Login page detected' );
		await loginToWpCom( page, mockPlanData, false );
		return;
	}

	await ( await WPLoginPage.init( page ) ).login();

	if ( ! mockPlanData ) {
		await (
			await DashboardPage.init( page )
		).setSandboxModeForPayments( cookie, new URL( resolveSiteUrl() ).host );
	}
}

/**
 * Login to WordPress.com
 *
 * @param {page} page - Playwright page instance.
 * @param {boolean} mockPlanData - Whether to mock plan data.
 * @param {boolean} navigateToPage - Whether to navigate to the login page first.
 */
export async function loginToWpCom( page, mockPlanData, navigateToPage = true ) {
	let loginPage;

	if ( navigateToPage ) {
		loginPage = await LoginPage.visit( page );
	} else {
		loginPage = await LoginPage.init( page );
	}

	if ( ! mockPlanData ) {
		await loginPage.setSandboxModeForPayments( cookie );
	}

	if ( await loginPage.isLoggedIn() ) {
		logger.step( 'Already logged into Wordpress.com' );
		return;
	}

	await loginPage.login();
}
