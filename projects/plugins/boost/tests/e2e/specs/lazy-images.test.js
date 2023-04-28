import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.cjs';

const testPostTitle = 'Hello World with image';

test.describe( 'Lazy Images module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page ).withTestContent( [ testPostTitle ] ).build();
	} );

	test.afterAll( async () => {
		await page.close();
	} );

	test( 'Images on a post should not be lazy loaded when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lazy_images' ] ).build();
		const frontend = await PostFrontendPage.visit( page );
		await frontend.click( `text=${ testPostTitle }` );
		expect(
			await page.locator( '.jetpack-lazy-image' ).count(),
			'No images should be lazy loaded'
		).toBe( 0 );
	} );

	test( 'Images on a post should be lazy loaded when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lazy_images' ] ).build();
		const frontend = await PostFrontendPage.visit( page );
		await frontend.click( `text=${ testPostTitle }` );
		expect(
			await page.locator( '.jetpack-lazy-image' ).count(),
			'Images should be lazy loaded'
		).toBeGreaterThan( 0 );
	} );
} );
