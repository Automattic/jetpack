import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage, PermalinksPage } from '../../lib/pages/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.mjs';

test.describe( 'Cache module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withInactiveModules( [
				'page_cache', // Make sure it's inactive.
			] )
			.withCleanEnv()
			.withConnection( true )
			.build();

		// Page Cache needs a pretty permalink structure to work properly.
		const permalinksPage = await PermalinksPage.visit( page );
		await permalinksPage.useDayNameStructure();
	} );

	test.afterAll( async () => {
		// Reset the environment for any other tests.
		await boostPrerequisitesBuilder( page ).withCleanEnv().withConnection( true ).build();
		await page.close();
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

	// Make sure Page Cache meta is visible when module is active.
	test( 'Page Cache meta information should show on the admin when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'page_cache' ] ).build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.waitForPageCacheMetaInfoVisibility(),
			'Page Cache meta information should be visible'
		).toBeTruthy();
	} );
} );
