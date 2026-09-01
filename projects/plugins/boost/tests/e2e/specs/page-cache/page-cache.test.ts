import { test, expect } from '../../lib/fixtures/test';
import playwrightConfig from '../../playwright.config';

test.describe( 'Cache module', () => {
	test.beforeAll( async ( { browser, boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();

		// Page Cache needs a pretty permalink structure to work properly.
		const page = await browser.newPage( playwrightConfig.use );
		// user day name structure
		await boostUtils.executeWpCommand(
			'option set permalink_structure "/%year%/%monthnum%/%day%/%postname%/"'
		);
		await page.close();
	} );

	// Disabling the module before each test, because each test will decide if
	// it needs the module enabled or not.
	test.beforeEach( async ( { boostUtils } ) => {
		await boostUtils.deactivateBoostModule( 'page_cache' );
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'No Page Cache meta information should show on the admin when the module is inactive', async ( {
		jetpackBoostPage,
		page,
	} ) => {
		await jetpackBoostPage.visit();
		await expect(
			page.getByTestId( 'page-cache-meta' ),
			'Page Cache meta information should not be visible'
		).toBeHidden();
	} );

	// Make sure there's no cache header when module is disabled.
	test( 'Page Cache header should not be present when module is inactive', async ( {
		browser,
		baseURL,
	} ) => {
		// Ensure default storageState is empty.
		const newContext = await browser.newContext( { storageState: undefined } );
		const newPage = await newContext.newPage();

		newPage.on( 'response', response => {
			if ( response.url().replace( /\/$/, '' ) !== baseURL?.replace( /\/$/, '' ) ) {
				return;
			}

			expect(
				Object.hasOwn( response.headers(), 'X-Jetpack-Boost-Cache'.toLowerCase() ),
				'Page Cache header should not be present'
			).toBeFalsy();
		} );

		await newPage.goto( '/' );

		await newPage.close();
		await newContext.close();
	} );

	// Make sure there's an error message when trying to enable Page Cache with plain permalinks.
	test( 'Enabling Page Cache should show error notice when plain permalinks are enabled', async ( {
		jetpackBoostPage,
		page,
		boostUtils,
	} ) => {
		// user plain structure
		await boostUtils.executeWpCommand( 'option set permalink_structure ""' );
		await jetpackBoostPage.visit();
		await jetpackBoostPage.toggleModule( 'page_cache', true, false );
		await expect(
			page.getByTestId( 'module-page_cache' ).getByText( 'Permalink settings must be updated' ),
			'Page Cache should show permalink error message when using plain permalink structure'
		).toBeVisible();
	} );

	// Make sure Page Cache meta is visible when module is active.
	test( 'Page Cache meta information should show on the admin when the module is active', async ( {
		jetpackBoostPage,
		page,
		boostUtils,
	} ) => {
		// user day name structure
		await boostUtils.executeWpCommand(
			'option set permalink_structure "/%year%/%monthnum%/%day%/%postname%/"'
		);

		// Activate the module.
		await jetpackBoostPage.visit();
		await jetpackBoostPage.toggleModule( 'page_cache', true );

		await expect(
			page.getByTestId( 'module-page_cache' ).getByRole( 'button', { name: 'Clear Cache' } ),
			'Page Cache meta information should be visible'
		).toBeVisible();
	} );

	// Make sure there's a cache header when module is enabled.
	test( 'Page Cache header should be present when module is active', async ( {
		browser,
		baseURL,
		boostUtils,
	} ) => {
		await boostUtils.activateBoostModule( 'page_cache' );

		// Ensure default storageState is empty.
		const newContext = await browser.newContext( { storageState: undefined } );
		const newPage = await newContext.newPage();

		let totalVisits = 0;

		newPage.on( 'response', response => {
			if ( response.url().replace( /\/$/, '' ) !== baseURL?.replace( /\/$/, '' ) ) {
				return;
			}

			totalVisits++;

			const responseHeaders = response.headers();
			const cacheHeaderName = 'X-Jetpack-Boost-Cache'.toLowerCase();

			// First visit may be a miss or a hit depending on preloading being finished.
			const expectValue = totalVisits === 1 ? [ 'miss', 'hit' ] : [ 'hit' ];
			const expectMessage =
				totalVisits === 1
					? 'Page Cache header should be set on first visit.'
					: 'Page Cache header should be set to hit on second visit.';
			expect(
				Object.hasOwn( responseHeaders, cacheHeaderName ) &&
					expectValue.includes( responseHeaders[ cacheHeaderName ] ),
				expectMessage
			).toBeTruthy();
		} );

		await newPage.goto( '/' );

		// Visit again to make sure the cache is hit.
		await newPage.goto( '/' );

		await newPage.close();
		await newContext.close();
	} );
} );
