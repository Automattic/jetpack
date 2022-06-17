import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { SearchConfigure } from '../pages/wp-admin/index.js';
import {
	disableInstantSearch,
	enableInstantSearch,
	searchAPIRoute,
	setTheme,
	setHighlightColor,
	setResultFormat,
	setDefaultSort,
	clearSearchPlanInfo,
} from '../helpers/search-helper.js';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../playwright.config.cjs';

test.describe( 'Search Configure', () => {
	let searchConfigure;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await clearSearchPlanInfo();
		await prerequisitesBuilder( page )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.withActiveModules( [ 'search' ] )
			.build();

		await enableInstantSearch();

		// initialize the settings we are going to manipulate.
		await setTheme();
		await setHighlightColor();
		await setResultFormat();
		await setDefaultSort();

		await page.close();
	} );

	test.afterAll( async () => {
		await setTheme();
		await setHighlightColor();
		await setResultFormat();
		await setDefaultSort();
		await disableInstantSearch();
	} );

	test.beforeEach( async ( { page } ) => {
		await searchAPIRoute( page );
		searchConfigure = await SearchConfigure.visit( page );
		await searchConfigure.waitForNetworkIdle();
	} );

	test( 'Can configure search overlay', async () => {
		await test.step( 'Can change and reflect settings', async () => {
			await searchConfigure.chooseDarkTheme();
			await searchConfigure.choosePinkAsHighlightColor();
			await searchConfigure.chooseProductFormat();
			await searchConfigure.chooseNewestAsDefaultSort();
			await searchConfigure.clickSaveButton();

			await checkSettings();
		} );

		await test.step( 'Settings stick after reload', async () => {
			// Reload the page.
			await searchConfigure.reload();
			await searchConfigure.waitForNetworkIdle();

			await checkSettings();
		} );
	} );

	async function checkSettings() {
		// Settings changed.
		expect( await searchConfigure.isDarkTheme(), "Theme should be 'dark'" ).toBeTruthy();
		expect(
			await searchConfigure.isHighlightPink(),
			"Highlight color should be 'pink'"
		).toBeTruthy();
		expect( await searchConfigure.isFormatProduct(), "Format should be 'product'" ).toBeTruthy();
		expect(
			await searchConfigure.isDefaultSortNewest(),
			"Default sort should be 'newest'"
		).toBeTruthy();
		// Settings reflected on preview.
		expect(
			await searchConfigure.isPreviewDarkTheme(),
			"Preview theme should be 'dark'"
		).toBeTruthy();
		expect(
			await searchConfigure.isPreviewFormatProduct(),
			"'Preview format should be 'product''"
		).toBeTruthy();
		expect(
			await searchConfigure.isPreviewDefaultSortNewest(),
			"Preview default sort should be 'newest'"
		).toBeTruthy();
	}
} );
