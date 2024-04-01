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
			// TinyMCE is enqueued via a helper plugin. When concatenation is not enabled,
			// it should be enqueued as a separate script.
			( await postFrontPage.page.locator( '[id="wp-tinymce-root-js"]' ).count() ) > 0,
			'JS concatenation shouldn`t occur when the module is inactive'
		).toBeTruthy();
	} );
} );
