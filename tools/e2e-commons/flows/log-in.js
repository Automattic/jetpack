import config from 'config';
import DashboardPage from '../pages/wp-admin/dashboard';
import LoginPage from '../pages/wpcom/login';
import WPLoginPage from '../pages/wp-admin/login';
import logger from '../logger';

const cookie = config.get( 'storeSandboxCookieValue' );

export async function loginToWpSite( mockPlanData ) {
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
			new URL( siteUrl ).host
		);
	}
}

export async function loginToWpCom( mockPlanData ) {
	const login = await LoginPage.visit( page );
	if ( ! mockPlanData ) {
		await login.setSandboxModeForPayments( cookie );
	}
	if ( await login.isLoggedIn() ) {
		return logger.step( 'Already logged into Wordpress.com' );
	}

	await login.login();
}
