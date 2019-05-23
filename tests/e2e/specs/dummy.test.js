/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import DashboardPage from '../lib/pages/wp-admin/dashboard';

describe( 'First test', () => {
	it( 'Can login to wp-admin and click Connect on Jetpack page', async () => {
		await visitAdminPage( '' );
		await DashboardPage.init( page );
	} );
} );
