/**
 * External dependencies
 */
import { prerequisitesBuilder } from 'jetpack-e2e-tests/lib/env/prerequisites';
/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';

let jetpackBoostPage;

describe( 'Speed Score feature', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).withConnection( true ).build();
	} );

	beforeEach( async function () {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	it( 'should display a mobile and desktop speed score greater than zero', async () => {
		await expect( await jetpackBoostPage.getSpeedScore( 'mobile' ) ).toBeGreaterThan( 0 );
		await expect( await jetpackBoostPage.getSpeedScore( 'desktop' ) ).toBeGreaterThan( 0 );
	} );
} );
