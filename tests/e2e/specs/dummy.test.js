/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import { connectThroughWPAdminIfNeeded } from '../lib/flows/jetpack-connect';

describe( 'First test', () => {
	it( 'Can login to wp-admin', async () => {
		await visitAdminPage( '' );
		await DashboardPage.init( page );
	} );

	it( 'Can go through the whole Jetpack connect process', async () => {
		await connectThroughWPAdminIfNeeded();
	} );
} );
