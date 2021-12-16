import { test, expect } from '../fixtures/base-test.js';
import { JetpackBoostPage } from '../lib/pages/index.js';

let jetpackBoostPage;

test.describe( 'Speed Score feature', () => {
	test.beforeEach( async function ( { page } ) {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test( 'The Speed Score section should display a mobile and desktop speed score greater than zero', async () => {
		expect( await jetpackBoostPage.getSpeedScore( 'mobile' ) ).toBeGreaterThan( 0 );
		expect( await jetpackBoostPage.getSpeedScore( 'desktop' ) ).toBeGreaterThan( 0 );
	} );
} );
