import { test, expect } from '../../lib/fixtures/test';
import playwrightConfig from '../../playwright.config';

test.describe( 'Auto refresh of speed scores', () => {
	test.beforeAll( async ( { browser, boostUtils } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostUtils.resetEnvironment();
		await boostUtils.connectIfNeeded( page );
		await boostUtils.unMockSpeedScore();

		await boostUtils.deactivateBoostModule( [ 'critical_css', 'render_blocking_js' ] );
		await page.close();
	} );

	[ 'render_blocking_js' ].forEach( moduleSlug => {
		// eslint-disable-next-line playwright/expect-expect
		test( `Enabling ${ moduleSlug } should refresh scores`, async ( { jetpackBoostPage } ) => {
			await test.step( 'Visit Jetpack Boost page', async () => {
				await jetpackBoostPage.visit();
			} );

			await test.step( 'Verify score is visible before module activation', async () => {
				await jetpackBoostPage.expectScoreToBeVisible();
			} );

			await test.step( `Toggle ${ moduleSlug } module on`, async () => {
				await jetpackBoostPage.toggleModule( moduleSlug, true );
			} );

			await test.step( 'Wait for score refresh after 2 second delay and verify score is visible', async () => {
				await new Promise( resolve => setTimeout( resolve, 2100 ) );
				await jetpackBoostPage.expectScoreToBeVisible();
			} );
		} );
	} );

	test( 'Score refresh should debounce between multiple module toggle', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await test.step( 'Visit Jetpack Boost page', async () => {
			await jetpackBoostPage.visit();
		} );

		await test.step( 'Verify score is visible initially', async () => {
			await jetpackBoostPage.expectScoreToBeVisible();
		} );

		await test.step( 'Wait 1 second before toggling another module', async () => {
			await new Promise( resolve => setTimeout( resolve, 1000 ) );
		} );

		let renderBlockingPromise;

		await test.step( 'Toggle minify_js module before automatic score refresh starts', async () => {
			renderBlockingPromise = jetpackBoostPage.toggleModule( 'minify_js', true );
		} );

		await test.step( 'Wait 1.1 seconds after second module toggle', async () => {
			await new Promise( resolve => setTimeout( resolve, 1100 ) );
		} );

		await test.step( 'Verify score refresh has not started after 2 seconds of first module toggle', async () => {
			await expect( page.getByRole( 'heading', { name: 'Loading…' } ) ).toBeHidden();
			await expect( page.getByRole( 'heading', { name: /Overall Score: [A-Z]/i } ) ).toBeVisible();
			await expect( page.locator( '.jb-score-bar--mobile .jb-score-bar__loading' ) ).toBeHidden();
			await expect( page.locator( '.jb-score-bar--desktop .jb-score-bar__loading' ) ).toBeHidden();
		} );

		await test.step( 'Wait 1 more second and verify score refresh has started after 2 seconds of second module toggle', async () => {
			await new Promise( resolve => setTimeout( resolve, 1000 ) );
			await expect( page.getByRole( 'heading', { name: 'Loading…' } ) ).toBeVisible();
			await expect( page.locator( '.jb-score-bar--mobile .jb-score-bar__loading' ) ).toBeVisible();
			await expect( page.locator( '.jb-score-bar--desktop .jb-score-bar__loading' ) ).toBeVisible();
		} );

		await test.step( 'Verify module toggle operations complete successfully', async () => {
			await renderBlockingPromise;
		} );
	} );
} );
