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

			let refreshRequestPromise: ReturnType< typeof jetpackBoostPage.waitForScoreRefreshRequest >;

			await test.step( `Toggle ${ moduleSlug } module on`, async () => {
				// Set up the network listener before the toggle so we catch the request
				// that fires after the 2-second debounce.
				refreshRequestPromise = jetpackBoostPage.waitForScoreRefreshRequest();
				// Suppress unhandled rejection if the toggle throws before we await.
				refreshRequestPromise.catch( () => {} );
				await jetpackBoostPage.toggleModule( moduleSlug, true );
			} );

			await test.step( 'Wait for score refresh request after debounce and verify score is visible', async () => {
				await refreshRequestPromise;
				await jetpackBoostPage.expectScoreToBeVisible();
			} );
		} );
	} );

	test( 'Score refresh should be debounced after module toggle', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await test.step( 'Visit Jetpack Boost page', async () => {
			await jetpackBoostPage.visit();
		} );

		await test.step( 'Verify score is visible initially', async () => {
			await jetpackBoostPage.expectScoreToBeVisible();
		} );

		// Set up network listener right before the toggle to avoid catching stale requests.
		const refreshRequestPromise = jetpackBoostPage.waitForScoreRefreshRequest();
		// Suppress unhandled rejection if the toggle throws before we await.
		refreshRequestPromise.catch( () => {} );

		let renderBlockingPromise: Promise< void > | undefined;

		await test.step( 'Toggle minify_js module', async () => {
			renderBlockingPromise = jetpackBoostPage.toggleModule( 'minify_js', true );
		} );

		await test.step( 'Wait 1.1 seconds after module toggle', async () => {
			await new Promise( resolve => setTimeout( resolve, 1100 ) );
		} );

		await test.step( 'Verify score refresh has not started within debounce window', async () => {
			await expect( page.getByRole( 'heading', { name: 'Loading…' } ) ).toBeHidden();
			await expect( page.getByRole( 'heading', { name: /Overall Score: [A-Z]/i } ) ).toBeVisible();
			await expect( page.locator( '.jb-score-bar--mobile .jb-score-bar__loading' ) ).toBeHidden();
			await expect( page.locator( '.jb-score-bar--desktop .jb-score-bar__loading' ) ).toBeHidden();
		} );

		await test.step( 'Verify score refresh starts after debounce', async () => {
			// Wait for the actual refresh network request instead of checking transient UI state.
			await refreshRequestPromise;
		} );

		await test.step( 'Verify module toggle operations complete successfully', async () => {
			await renderBlockingPromise;
		} );
	} );
} );
