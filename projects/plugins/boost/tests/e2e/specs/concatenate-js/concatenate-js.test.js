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

	test( 'No Concatenate JS meta information should show on the admin when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'minify_js' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isConcatenateJsMetaVisible(),
			'Concatenate JS meta information should not be visible'
		).toBeFalsy();
	} );

	test( 'JS concatenation shouldn`t occur when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page )
			.withInactiveModules( [ 'minify_js' ] )
			.withEnqueuedAssets( true )
			.build();
		const postFrontPage = await PostFrontendPage.visit( page );

		expect(
			// This script is enqueued via a helper plugin.
			( await postFrontPage.page.locator( '[id="e2e-script-one-js"]' ).count() ) > 0,
			'JS concatenation shouldn`t occur when the module is inactive'
		).toBeTruthy();
	} );

	test( 'Meta information should be visible when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'minify_js' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isConcatenateJsMetaVisible(),
			'Concatenate JS meta information should be visible'
		).toBeTruthy();
	} );

	test( 'JS Concatenation occurs when module is active', async () => {
		await boostPrerequisitesBuilder( page )
			.withActiveModules( [ 'minify_js' ] )
			.withEnqueuedAssets( true )
			.build();
		const postFrontPage = await PostFrontendPage.visit( page );

		expect(
			// e2e-script-one and e2e-script-two are enqueued by a helper plugin. When concatenation is enabled,
			// they should be concatenated into a single script.
			( await postFrontPage.page
				.locator( '[data-handles="e2e-script-one,e2e-script-two"]' )
				.count() ) > 0,
			'JS Concatenation occurs when module is active'
		).toBeTruthy();
	} );

	test( 'jQuery should not be concatenated as it is excluded by default', async () => {
		await boostPrerequisitesBuilder( page )
			.withActiveModules( [ 'minify_js' ] )
			.withEnqueuedAssets( true )
			.build();
		const postFrontPage = await PostFrontendPage.visit( page );

		expect(
			// jQuery is enqueued by a helper plugin.
			( await postFrontPage.page.locator( '[id="jquery-core-js"]' ).count() ) > 0,
			'jQuery should not be concatenated'
		).toBeTruthy();
	} );
} );
