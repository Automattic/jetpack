import config from 'config';
import { DashboardPage, WPLoginPage } from '../pages/wp-admin/index.js';
import { LoginPage } from '../pages/wpcom/index.js';
import logger from '../logger.cjs';
import { resolveSiteUrl } from '../helpers/utils-helper.cjs';

const cookie = config.get( 'storeSandboxCookieValue' );

export async function loginToWpSite( page, mockPlanData ) {
	// Navigating to login url will always display the login form even if the user is already logged in
	// To prevent unnecessary log in we navigate to Dashboard and check if logged in
	await DashboardPage.visit( page, false );

	if ( await WPLoginPage.isLoggedIn( page ) ) {
		logger.step( 'Already logged in!' );
	} else {
		await ( await WPLoginPage.init( page ) ).login();
	}

	if ( ! mockPlanData ) {
		await ( await DashboardPage.init( page ) ).setSandboxModeForPayments(
			cookie,
			new URL( resolveSiteUrl() ).host
		);
	}
}

export async function loginToWpCom( page, mockPlanData ) {
	const login = await LoginPage.visit( page );
	if ( ! mockPlanData ) {
		await login.setSandboxModeForPayments( cookie );
	}
	if ( await login.isLoggedIn() ) {
		return logger.step( 'Already logged into Wordpress.com' );
	}

	await login.login();
}
