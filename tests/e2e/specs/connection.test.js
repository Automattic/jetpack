/**
 * Internal dependencies
 */
import { catchBeforeAll, step } from '../lib/setup-env';
import { doInPlaceConnection } from '../lib/flows/jetpack-connect';
import { execWpCommand } from '../lib/utils-helper';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import JetpackPage from '../lib/pages/wp-admin/jetpack';

describe( 'Connection', () => {
	catchBeforeAll( async () => {
		await execWpCommand( 'wp option delete jetpack_private_options' );
		await execWpCommand( 'wp config set --raw JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME false' );
		// For some reason it need 2 reloads to make constant actually work.
		await page.reload();
		await page.reload();
	} );

	afterAll( async () => {
		await execWpCommand(
			'wp option update jetpack_private_options --format=json',
			'< jetpack_private_options.txt'
		);
		await execWpCommand( 'wp config set --raw JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME true' );
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
