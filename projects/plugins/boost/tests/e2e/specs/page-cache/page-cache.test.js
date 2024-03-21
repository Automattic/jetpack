import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.mjs';

test.describe( 'Cache module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( true ).build();
	} );

	test( 'No Page Cache meta information should show on the admin when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'page_cache' ] ).build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isThePageCacheMetaInformationVisible(),
			'Page Cache meta information should not be visible'
		).toBeFalsy();
	} );

	// Make sure there's no cache header when module is disabled.
	test( 'Page Cache should not be present when Page Cache module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'page_cache' ] ).build();
		await PostFrontendPage.visit( page );

		page.on( 'response', response => {
			expect(
				response.headers().hasOwnProperty( 'X-Jetpack-Boost-Cache' ),
				'Page Cache header should not be present'
			).toBeFalsy();
		} );
	} );
} );
