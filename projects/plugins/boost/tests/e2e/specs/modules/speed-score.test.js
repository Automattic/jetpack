import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

test.describe( 'Speed Score feature', () => {
	let page;
	let jetpackBoostPage;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage();
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( true )
			.withSpeedScoreMocked( false )
			.build();
	} );

	test.afterAll( async () => {
		await page.close();
	} );

	test.beforeEach( async () => {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test( 'The Speed Score section should display a mobile and desktop speed score greater than zero', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();

		expect(
			await jetpackBoostPage.getSpeedScore( 'mobile' ),
			'Mobile speed score should be greater than 0'
		).toBeGreaterThan( 0 );
		expect(
			await jetpackBoostPage.getSpeedScore( 'desktop' ),
			'Desktop speed score should be greater than 0'
		).toBeGreaterThan( 0 );
	} );

	test( 'The Speed Scores should be able to refresh', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.clickRefreshSpeedScore();

		await jetpackBoostPage.waitForScoreLoadingToFinish();
		expect( await jetpackBoostPage.isScoreVisible(), 'Score should be displayed' ).toBeTruthy();
	} );

	test( 'Should be able to click info icon next to overall score and see the detailed overall score description popin', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.page.click(
			'[data-testid="speed-scores-top"] .icon-tooltip-wrapper > button'
		);
		expect(
			await jetpackBoostPage.isScoreDescriptionPopinVisible(),
			'Score description should be visible'
		).toBeTruthy();
	} );
} );
