import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Speed Score feature', () => {
	test.beforeAll( async ( { browser, boostUtils } ) => {
		await boostUtils.resetEnvironment();
		const page = await browser.newPage();
		await boostUtils.connectIfNeeded( page );
		await page.close();
		await boostUtils.unMockSpeedScore();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'The Speed Score section should display a mobile and desktop speed score greater than zero', async ( {
		jetpackBoostPage,
	} ) => {
		await jetpackBoostPage.visit();
		await jetpackBoostPage.expectScoreToBeVisible();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'The Speed Scores should be able to refresh', async ( { jetpackBoostPage } ) => {
		await jetpackBoostPage.visit();
		await jetpackBoostPage.expectScoreToBeVisible();
		// Set up network listener before running the speed test; the test depends on the refresh
		// having completed before we re-assert score visibility, so wait on the response.
		const refreshResponsePromise = jetpackBoostPage.waitForScoreRefreshResponse();
		// Suppress unhandled rejection if the click throws before we await.
		refreshResponsePromise.catch( () => {} );
		await jetpackBoostPage.page
			.getByRole( 'button', { name: 'Run speed test', exact: true } )
			.click();
		await refreshResponsePromise;
		await jetpackBoostPage.expectScoreToBeVisible();
	} );

	test( 'Should be able to hover the info icon next to the overall grade and see its description', async ( {
		jetpackBoostPage,
	} ) => {
		await jetpackBoostPage.visit();
		await jetpackBoostPage.expectScoreToBeVisible();
		await jetpackBoostPage
			.scoresCard()
			.getByRole( 'button', { name: 'How the overall grade is calculated' } )
			.hover();
		await expect(
			jetpackBoostPage.page.getByText( 'Your overall score is a summary' ),
			'Score description should be visible'
		).toBeVisible();
	} );
} );
