import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage, PermalinksPage } from '../../lib/pages/index.js';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';
import { WPLoginPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.mjs';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.js';

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
		const newPage = await browser.newPage( playwrightConfig.use );
		const postFrontPage = await PostFrontendPage.visit( newPage );
		await postFrontPage.logout();

		newPage.on( 'response', response => {
			if ( response.url().replace( /\/$/, '' ) !== resolveSiteUrl().replace( /\/$/, '' ) ) {
				return;
			}

			expect(
				response.headers().hasOwnProperty( 'X-Jetpack-Boost-Cache'.toLowerCase() ),
				'Page Cache header should not be present'
			).toBeFalsy();
		} );

		await PostFrontendPage.visit( newPage );

		await newPage.close();
	} );

	// Make sure there's an error message when trying to enable Page Cache with plain permalinks.
	test( 'Enabling Page Cache should show error notice when plain permalinks are enabled', async () => {
		const loginPage = await WPLoginPage.visit( page );
		await loginPage.login();

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

		const newPage = await browser.newPage( playwrightConfig.use );
		const postFrontPage = await PostFrontendPage.visit( newPage );
		await postFrontPage.logout();

		let totalVisits = 0;

		newPage.on( 'response', response => {
			if ( response.url().replace( /\/$/, '' ) !== resolveSiteUrl().replace( /\/$/, '' ) ) {
				return;
			}

			totalVisits++;

			const responseHeaders = response.headers();
			const cacheHeaderName = 'X-Jetpack-Boost-Cache'.toLowerCase();

			// First visit should always be a miss.
			if ( totalVisits === 1 ) {
				expect(
					responseHeaders.hasOwnProperty( cacheHeaderName ) &&
						responseHeaders[ cacheHeaderName ] === 'miss',
					'Page Cache header should be set to miss on first visit.'
				).toBeTruthy();
			} else {
				expect(
					responseHeaders.hasOwnProperty( cacheHeaderName ) &&
						responseHeaders[ cacheHeaderName ] === 'hit',
					'Page Cache header should be set to hit on second visit.'
				).toBeTruthy();
			}
		} );

		await PostFrontendPage.visit( newPage );

		// Visit again to make sure the cache is hit.
		await PostFrontendPage.visit( newPage );

		await newPage.close();
	} );
} );
