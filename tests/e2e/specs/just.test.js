/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
import LoginPage from '../lib/pages/wpcom/login';
import AuthorizePage from '../lib/pages/wpcom/authorize';
import JetpackSiteTypePage from '../lib/pages/jetpack-connect/site-type';
import JetpackSiteTopicPage from '../lib/pages/jetpack-connect/site-topic';
import JetpackUserTypePage from '../lib/pages/jetpack-connect/user-type';
import PickAPlanPage from '../lib/pages/wpcom/pick-a-plan';
import { getAccountCredentials } from '../lib/pageHelper';

describe( 'First test', () => {
	it( 'Can login to wp-admin and click Connect on Jetpack page', async () => {
		await visitAdminPage( '' );
		await DashboardPage.init( page );

		await ( await Sidebar.init( page ) ).selectJetpack();

		await ( await JetpackPage.init( page ) ).connect();
		// } );

		// it( 'Can login to WPCOM and approve connection', async () => {
		//Credentials
		const creds = getAccountCredentials( 'defaultUser' );
		await ( await LoginPage.init( page ) ).login( creds[ 0 ], creds[ 1 ] );

		await ( await AuthorizePage.init( page ) ).approve();
		// } );

		// it( 'Can select a site type', async () => {
		await ( await JetpackSiteTypePage.init( page ) ).selectSiteType( 'blog' );
		// } );

		// it( 'Can select a site topic', async () => {
		await ( await JetpackSiteTopicPage.init( page ) ).selectSiteTopic( 'test site' );
		// } );

		// it( 'Can select a user type', async () => {
		await ( await JetpackUserTypePage.init( page ) ).selectUserType( 'creator' );

		// } );

		await ( await PickAPlanPage.init( page ) ).selectFreeJetpackPlan();

		await ( await JetpackPage.init( page ) ).jumpstartDisplayed();

		// it( 'wait on done', async () => {
	} );
} );
