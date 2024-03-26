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
	test( 'Page Cache header should not be present when module is inactive', async () => {
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

	// Make sure there's an error message when trying to enable Page Cache with plain permalinks.
	test( 'Page Cache should show error notice when plain permalinks are enabled', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'page_cache' ] ).build();

		const permalinksPage = await PermalinksPage.visit( page );
		await permalinksPage.usePlainStructure();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.toggleModule( 'page_cache' );
		expect(
			await jetpackBoostPage.waitForPageCachePermalinksErrorVisibility(),
			'Page Cache should show permalink error message when using plain permalink structure'
		).toBeTruthy();
	} );

	// Make sure there's a cache header when module is enabled.
	test( 'Page Cache header should be present when module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'page_cache' ] ).build();
		const postFrontendPage = await PostFrontendPage.visit( page );
		// Cache is only available to logged out users.
		await postFrontendPage.logout();

		page.on( 'response', response => {
			// Not sure why there's a trailing slash, but it's messing up the test.
			if ( response.url().replace( /\/$/, '' ) !== postFrontendPage.url ) {
				return;
			}

			expect(
				response.headers().hasOwnProperty( 'X-Jetpack-Boost-Cache'.toLowerCase() ),
				'Page Cache header should be present'
			).toBeTruthy();
		} );
	} );
} );
