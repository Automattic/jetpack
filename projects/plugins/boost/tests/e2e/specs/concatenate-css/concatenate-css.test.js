import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.mjs';

test.describe( 'Concatenate JS', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( true ).build();
	} );

	test.afterAll( async () => {} );

	test( 'No Concatenate CSS meta information should show on the admin when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'minify_css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isConcatenateCssMetaVisible(),
			'Concatenate CSS meta information should not be visible'
		).toBeFalsy();
	} );

	test( 'CSS concatenation shouldn`t occur when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page )
			.withInactiveModules( [ 'minify_css' ] )
			.withEnqueuedAssets( true )
			.build();
		const postFrontPage = await PostFrontendPage.visit( page );

		expect(
			// This style is enqueued via a helper plugin.
			( await postFrontPage.page.locator( '[id="e2e-style-one-css"]' ).count() ) > 0,
			'CSS concatenation shouldn`t occur when the module is inactive'
		).toBeTruthy();
	} );

	test( 'Meta information should be visible when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'minify_css' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isConcatenateCssMetaVisible(),
			'Concatenate CSS meta information should be visible'
		).toBeTruthy();
	} );

	test( 'CSS Concatenation occurs when module is active', async () => {
		await boostPrerequisitesBuilder( page )
			.withActiveModules( [ 'minify_css' ] )
			.withEnqueuedAssets( true )
			.build();
		const postFrontPage = await PostFrontendPage.visit( page );

		expect(
			// e2e-style-one and e2e-style-two are enqueued by a helper plugin. When concatenation is enabled,
			// they should be concatenated into a single style.
			( await postFrontPage.page
				.locator( '[data-handles*="e2e-style-one,e2e-style-two"]' )
				.count() ) > 0,
			'CSS Concatenation occurs when module is active'
		).toBeTruthy();
	} );

	test( 'Admin bar stylesheet should not be concatenated as it is excluded by default', async () => {
		await boostPrerequisitesBuilder( page )
			.withActiveModules( [ 'minify_css' ] )
			.withEnqueuedAssets( true )
			.build();
		const postFrontPage = await PostFrontendPage.visit( page );

		expect(
			// Admin bar stylesheet is enqueued by default when logged-in.
			( await postFrontPage.page.locator( '[id="admin-bar-css"]' ).count() ) > 0,
			'Admin bar stylesheet should not be concatenated'
		).toBeTruthy();
	} );
} );
