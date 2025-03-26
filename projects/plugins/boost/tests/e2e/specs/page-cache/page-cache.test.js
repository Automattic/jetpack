import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { resolveSiteUrl } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import { PostFrontendPage } from '_jetpack-e2e-commons/pages/index.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage, PermalinksPage } from '../../lib/pages/index.js';

test.describe( 'Cache module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withLoggedIn( true )
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

	// Disabling the module before each test, because each test will decide if
	// it needs the module enabled or not.
	test.beforeEach( async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'page_cache' ] ).build();
	} );

	test.afterAll( async () => {
		// Reset the environment for any other tests.
		await boostPrerequisitesBuilder( page ).withCleanEnv().withConnection( true ).build();
		await page.close();
	} );

	test( 'No Page Cache meta information should show on the admin when the module is inactive', async () => {
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isThePageCacheMetaInformationVisible(),
			'Page Cache meta information should not be visible'
		).toBeFalsy();
	} );

	// Make sure there's no cache header when module is disabled.
	test( 'Page Cache header should not be present when module is inactive', async ( {
		browser,
	} ) => {
		// Ensure default storageState is empty.
		const newContext = await browser.newContext( { storageState: {} } );
		const newPage = await newContext.newPage();

		newPage.on( 'response', response => {
			if ( response.url().replace( /\/$/, '' ) !== resolveSiteUrl().replace( /\/$/, '' ) ) {
				return;
			}

			expect(
				Object.hasOwn( response.headers(), 'X-Jetpack-Boost-Cache'.toLowerCase() ),
				'Page Cache header should not be present'
			).toBeFalsy();
		} );

		await PostFrontendPage.visit( newPage );

		await newPage.close();
		await newContext.close();
	} );

	// Make sure there's an error message when trying to enable Page Cache with plain permalinks.
	test( 'Enabling Page Cache should show error notice when plain permalinks are enabled', async () => {
		const permalinksPage = await PermalinksPage.visit( page );
		await permalinksPage.usePlainStructure();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.toggleModule( 'page_cache' );
		expect(
			await jetpackBoostPage.waitForPageCachePermalinksErrorVisibility(),
			'Page Cache should show permalink error message when using plain permalink structure'
		).toBeTruthy();
	} );

	// Make sure Page Cache meta is visible when module is active.
	test( 'Page Cache meta information should show on the admin when the module is active', async () => {
		const permalinksPage = await PermalinksPage.visit( page );
		await permalinksPage.useDayNameStructure();

		// Activate the module.
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		await jetpackBoostPage.toggleModule( 'page_cache' );

		expect(
			await jetpackBoostPage.waitForPageCacheMetaInfoVisibility(),
			'Page Cache meta information should be visible'
		).toBeTruthy();
	} );

	// Make sure there's a cache header when module is enabled.
	test( 'Page Cache header should be present when module is active', async ( { browser } ) => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'page_cache' ] ).build();

		// Ensure default storageState is empty.
		const newContext = await browser.newContext( { storageState: {} } );
		const newPage = await newContext.newPage();

		let totalVisits = 0;

		newPage.on( 'response', response => {
			if ( response.url().replace( /\/$/, '' ) !== resolveSiteUrl().replace( /\/$/, '' ) ) {
				return;
			}

			totalVisits++;

			const responseHeaders = response.headers();
			const cacheHeaderName = 'X-Jetpack-Boost-Cache'.toLowerCase();

			// First visit should always be a miss.
			const expectValue = totalVisits === 1 ? 'miss' : 'hit';
			const expectMessage =
				totalVisits === 1
					? 'Page Cache header should be set to miss on first visit.'
					: 'Page Cache header should be set to hit on second visit.';
			expect(
				Object.hasOwn( responseHeaders, cacheHeaderName ) &&
					responseHeaders[ cacheHeaderName ] === expectValue,
				expectMessage
			).toBeTruthy();
		} );

		await PostFrontendPage.visit( newPage );

		// Visit again to make sure the cache is hit.
		await PostFrontendPage.visit( newPage );

		await newPage.close();
		await newContext.close();
	} );
} );
