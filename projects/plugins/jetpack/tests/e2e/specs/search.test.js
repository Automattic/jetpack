/**
 * Internal dependencies
 */
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import { activateModule, execMultipleWpCommands } from '../lib/utils-helper';
import Homepage from '../lib/pages/homepage';

describe( 'Search', () => {
	beforeAll( async () => {
		await syncJetpackPlanData( 'complete' );
		await activateModule( page, 'search' );
	} );

	afterAll( async () => {
		await execMultipleWpCommands( 'wp jetpack module deactivate search' );
	} );

	it( 'can open the search modal', async () => {
		const frontend = await Homepage.visit( page );
	} );
} );
