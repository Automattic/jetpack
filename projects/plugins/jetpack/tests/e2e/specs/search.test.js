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
		await execMultipleWpCommands( 'wp option update instant_search_enabled 1' );
	} );

	afterAll( async () => {
		await execMultipleWpCommands( 'wp jetpack module deactivate search' );
	} );

	it( 'can open the search modal', async () => {
		const homepage = await Homepage.visit( page );
		// NOTE: This ideally would better be in init, not to to be called directly
		await homepage.registerRouteInterceptions();
		await homepage.focusSearchInput();
		await homepage.enterQuery();
		await page.pause();
		expect( await homepage.isSearchResultOverlayVisible() ).toBeTruthy();
		expect( await homepage.isSearchResultAvailable() ).toBeTruthy();
	} );
} );
