import DashboardPage from '../pages/wp-admin/DashboardPage';
import WPLoginPage from '../pages/wp-admin/WPLoginPage';
import logger from '../logger';

export async function loginToWpSite() {
	// Navigating to login url will always display the login form even if the user is already logged in
	// To prevent unnecessary log in we navigate to Dashboard and check if logged in
	await DashboardPage.visit( page, false );

	if ( await WPLoginPage.isLoggedIn( page ) ) {
		logger.step( 'Already logged in!' );
	} else {
		await ( await WPLoginPage.init( page ) ).login();
	}
}
