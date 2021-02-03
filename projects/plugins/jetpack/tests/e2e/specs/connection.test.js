/**
 * Internal dependencies
 */
import { catchBeforeAll, step } from '../lib/setup-env';
import { doInPlaceConnection } from '../lib/flows/jetpack-connect';
import { execMultipleWpCommands, execWpCommand } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';

// Disable pre-connect for this test suite
process.env.SKIP_CONNECT = true;

describe( 'Connection', () => {
	catchBeforeAll( async () => {
		await execMultipleWpCommands(
			'wp option delete e2e_jetpack_plan_data',
			'wp option delete jetpack_active_plan',
			'wp option delete jetpack_private_options',
			'wp option delete jetpack_sync_error_idc'
		);
		await page.reload();
		await page.reload();
	} );

	afterAll( async () => {
		await execWpCommand(
			'wp option update jetpack_private_options --format=json < jetpack_private_options.txt'
		);
	} );

	it( 'In-place', async () => {
		await step( 'Can start in-place connection', async () => {
			await ( await Sidebar.init( page ) ).selectJetpack();
			await doInPlaceConnection();
		} );

		await step( 'Can assert that site is connected', async () => {
			const jetpackPage = await JetpackPage.init( page );
			expect( await jetpackPage.isConnected() ).toBeTruthy();
		} );
	} );
} );
