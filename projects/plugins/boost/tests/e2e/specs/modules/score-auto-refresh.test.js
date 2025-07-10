import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

test.describe( 'Auto refresh of speed scores', () => {
	let page;
	let jetpackBoostPage;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );

		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( true )
			.withSpeedScoreMocked( false )
			.withInactiveModules( [ 'critical_css', 'render_blocking_js' ] )
			.build();
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test.afterAll( async () => {
		await page.close();
	} );

	[ 'render_blocking_js' ].forEach( moduleSlug => {
		test( `Enabling ${ moduleSlug } should refresh scores`, async () => {
			await jetpackBoostPage.waitForScoreLoadingToFinish();

			expect( await jetpackBoostPage.isScoreVisible(), 'Score should be visible' ).toBeTruthy();

			await jetpackBoostPage.toggleModule( moduleSlug, true );

			await new Promise( resolve => setTimeout( resolve, 2100 ) ); // Score refresh starts after 2 seconds delay

			await jetpackBoostPage.waitForScoreLoadingToFinish();
			expect( await jetpackBoostPage.isScoreVisible(), 'Score should be visible' ).toBeTruthy();
		} );
	} );

	test( 'Score refresh should debounce between multiple module toggle', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();

		expect( await jetpackBoostPage.isScoreVisible(), 'Score should be visible' ).toBeTruthy();

		// Wait a second before toggling another.
		await new Promise( resolve => setTimeout( resolve, 1000 ) );

		// Toggle another module before the automatic score refresh started
		const renderBlockingPromise = jetpackBoostPage.toggleModule( 'minify_js', true );

		// Wait slightly more than a second after second module is toggled
		await new Promise( resolve => setTimeout( resolve, 1100 ) );

		// Score refresh should not have started after two seconds of toggling first module
		expect( await jetpackBoostPage.isScoreLoading(), 'Score should not be loading' ).toBeFalsy();

		// Score refresh should have started after two seconds of toggling second module
		await new Promise( resolve => setTimeout( resolve, 1000 ) );
		expect( await jetpackBoostPage.isScoreLoading(), 'Score should be loading' ).toBeTruthy();

		// Still expect toggling those two modules to succeed.
		await Promise.all( [ renderBlockingPromise ] );
	} );
} );
