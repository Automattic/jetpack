import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { test, expect } from '../fixtures/base-test.js';
import { JetpackBoostPage } from '../lib/pages/index.js';

let jetpackBoostPage;

test.describe( 'Speed Score feature', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage();
		await prerequisitesBuilder( page )
			.withInactivePlugins( [ 'e2e-mock-speed-score-api.php' ] )
			.build();
	} );

	test.afterAll( async ( { browser } ) => {
		const page = await browser.newPage();
		await prerequisitesBuilder( page )
			.withActivePlugins( [ 'e2e-mock-speed-score-api.php' ] )
			.build();
	} );

	test.beforeEach( async function ( { page } ) {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test( 'The Speed Score section should display a mobile and desktop speed score greater than zero', async () => {
		expect( await jetpackBoostPage.getSpeedScore( 'mobile' ) ).toBeGreaterThan( 0 );
		expect( await jetpackBoostPage.getSpeedScore( 'desktop' ) ).toBeGreaterThan( 0 );
	} );

	test( 'The Speed Scores should be able to refresh', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.clickRefreshSpeedScore();

		expect( await jetpackBoostPage.isScoreLoading() ).toBeTruthy();
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		expect( await jetpackBoostPage.isScoreVisible() ).toBeTruthy();
	} );

	test( 'Should be able to hover info icon next to overall score and see the detailed overall score description popin', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.page.hover( '.jb-score-context' );
		expect( await jetpackBoostPage.isScoreDescriptionPopinVisible() ).toBeTruthy();
	} );
} );
