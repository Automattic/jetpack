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

	test( 'The Speed Scores should be able to refresh', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.clickRefreshSpeedScore();

		expect( await jetpackBoostPage.currentPageTitleIs( 'Loading…' ) ).toBeTruthy();
		expect( await jetpackBoostPage.isScorebarLoading( 'mobile' ) ).toBeTruthy();
		expect( await jetpackBoostPage.isScorebarLoading( 'desktop' ) ).toBeTruthy();

		await jetpackBoostPage.waitForScoreLoadingToFinish();
		expect( await jetpackBoostPage.getSpeedScore( 'mobile' ) ).toBeGreaterThan( 0 );
		expect( await jetpackBoostPage.getSpeedScore( 'desktop' ) ).toBeGreaterThan( 0 );
		expect( await jetpackBoostPage.currentPageTitleIs( /Overall score: [A-Z]/ ) ).toBeTruthy();
	} );

	test( 'Should be able to hover info icon next to overall score and see the detailed overall score description popin', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.page.hover( '.jb-score-context' );
		expect( await jetpackBoostPage.isScoreDescriptionPopinVisible() ).toBeTruthy();
	} );
} );
