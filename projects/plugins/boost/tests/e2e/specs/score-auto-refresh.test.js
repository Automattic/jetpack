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
			.withInactiveModules( [ 'critical_css', 'lazy_images', 'render_blocking_js' ] )
			.build();
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	[ 'lazy_images', 'render_blocking_js' ].forEach( moduleSlug => {
		test( `Enabling ${ moduleSlug } should refresh scores`, async () => {
			await jetpackBoostPage.waitForScoreLoadingToFinish();

			await jetpackBoostPage.toggleModule( moduleSlug );

			await new Promise( resolve => setTimeout( resolve, 2100 ) ); // Score refresh starts after 2 seconds delay

			expect( await jetpackBoostPage.isScoreLoading(), 'Score should be loading' ).toBeTruthy();
			await jetpackBoostPage.waitForScoreLoadingToFinish();
			expect( await jetpackBoostPage.isScoreVisible(), 'Score should be visible' ).toBeTruthy();
		} );
	} );

	test( 'Score refresh should debounce between multiple module toggle', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();

		const toggleLazyPromise = jetpackBoostPage.toggleModule( 'lazy_images' );

		// Wait a second before toggling another.
		await new Promise( resolve => setTimeout( resolve, 1000 ) );

		// Toggle another module before the automatic score refresh started
		const renderBlockingPromise = jetpackBoostPage.toggleModule( 'render_blocking_js' );

		// Wait slightly more than a second after second module is toggled
		await new Promise( resolve => setTimeout( resolve, 1100 ) );

		// Score refresh should not have started after two seconds of toggling first module
		expect( await jetpackBoostPage.isScoreLoading(), 'Score should not be loading' ).toBeFalsy();

		// Score refresh should have started after two seconds of toggling second module
		await new Promise( resolve => setTimeout( resolve, 1000 ) );
		expect( await jetpackBoostPage.isScoreLoading(), 'Score should be loading' ).toBeTruthy();

		// Still expect toggling those two modules to succeed.
		await Promise.all( [ toggleLazyPromise, renderBlockingPromise ] );
	} );
} );
