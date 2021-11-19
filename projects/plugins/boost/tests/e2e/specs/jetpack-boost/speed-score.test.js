/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';

let jetpackBoostPage;

describe( 'Speed Score feature', () => {
	beforeEach( async function () {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	it( 'Should display a mobile and desktop speed score greater than zero', async () => {
		await expect( await jetpackBoostPage.getSpeedScore( 'mobile' ) ).toBeGreaterThan( 0 );
		await expect( await jetpackBoostPage.getSpeedScore( 'desktop' ) ).toBeGreaterThan( 0 );
	} );
} );
