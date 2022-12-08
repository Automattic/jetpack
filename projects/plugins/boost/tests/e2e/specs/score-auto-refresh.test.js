import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.cjs';
import { JetpackBoostPage } from '../lib/pages/index.js';

test.describe( 'Auto refresh of speed scores', () => {
	let page;
	let jetpackBoostPage;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );

		await boostPrerequisitesBuilder( page )
			.withConnection( true )
			.withInactiveModules( [ 'critical-css', 'lazy-images', 'render-blocking-js' ] )
			.build();
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test( 'Score refresh should debounce between multiple module toggle', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();

		await jetpackBoostPage.toggleModule( 'lazy-images' );

		// Wait a second after first module is toggled
		await new Promise( resolve => setTimeout( resolve, 1000 ) );

		// Toggle another module before the automatic score refresh started
		await jetpackBoostPage.toggleModule( 'render-blocking-js' );

		// Wait slightly more than a second after second module is toggled
		await new Promise( resolve => setTimeout( resolve, 1100 ) );

		// Score refresh should not have started after two seconds of toggling first module
		expect( await jetpackBoostPage.isScoreLoading(), 'Score should not be loading' ).toBeFalsy();

		// Score refresh should have started after two seconds of toggling second module
		await new Promise( resolve => setTimeout( resolve, 1000 ) );
		expect( await jetpackBoostPage.isScoreLoading(), 'Score should be loading' ).toBeTruthy();
	} );
} );
