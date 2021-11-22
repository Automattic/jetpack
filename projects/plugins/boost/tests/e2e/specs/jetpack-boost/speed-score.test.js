import { test, expect } from '@playwright/test';
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage.js';

let jetpackBoostPage;

test.describe( 'Speed Score feature', () => {
	test.beforeEach( async function ( { page } ) {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test( 'Should display a mobile and desktop speed score greater than zero', async () => {
		expect( await jetpackBoostPage.getSpeedScore( 'mobile' ) ).toBeGreaterThan( 0 );
		expect( await jetpackBoostPage.getSpeedScore( 'desktop' ) ).toBeGreaterThan( 0 );
	} );
} );
