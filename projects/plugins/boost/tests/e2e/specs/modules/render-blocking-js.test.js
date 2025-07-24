import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { PostFrontendPage } from '_jetpack-e2e-commons/pages/index.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';

const testPostTitle = 'Hello World with JavaScript';

test.describe( 'Render Blocking JS module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withMockConnection( true )
			.withSpeedScoreMocked( true )
			.withTestContent( [ testPostTitle ] )
			.build();
	} );

	test.afterAll( async () => {
		await page.close();
	} );

	test( 'JavaScript on a post should be at its original position in the document when the module is inactive', async ( {
		testUtils,
	} ) => {
		await testUtils.deactivateModule( 'render_blocking_js' );
		const frontend = await PostFrontendPage.visit( page );
		await frontend.click( `text=${ testPostTitle }` );
		// For this test we are checking if the JavaScript from the test content is still inside its original parent element
		// which has the "render-blocking-js" class.
		const script = page.locator( '#blockingScript' );
		expect(
			await script.evaluate( element =>
				element.parentElement.classList.contains( 'render-blocking-js' )
			)
		).toBeTruthy();
		// Confirm that the JavaScript was executed.
		await page.locator( '#testDiv' ).isHidden();
	} );

	test( 'JavaScript on a post should be pushed at the bottom of the document when the module is active', async ( {
		testUtils,
	} ) => {
		// Since the render blocking js module grab all JavaScript from a document and pushed it at the bottom of the DOM.
		// For this test we are checking if the JavaScript from the test content is not anymore in its parent element.
		// which has the "render-blocking-js" class.
		await testUtils.activateModule( 'render_blocking_js' );
		const frontend = await PostFrontendPage.visit( page );
		await frontend.click( `text=${ testPostTitle }` );
		const script = page.locator( '#blockingScript' );
		expect(
			await script.evaluate( element =>
				element.parentElement.classList.contains( 'render-blocking-js' )
			)
		).toBeFalsy();
		// Confirm that the JavaScript was executed.
		await page.locator( '#testDiv' ).isHidden();
	} );
} );
