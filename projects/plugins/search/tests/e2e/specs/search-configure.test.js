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

			// Settings changed.
			expect( await searchConfigure.isDarkTheme() ).toBeTruthy();
			expect( await searchConfigure.isHighlightPink() ).toBeTruthy();
			expect( await searchConfigure.isFormatProduct() ).toBeTruthy();
			expect( await searchConfigure.isDefaultSortNewest() ).toBeTruthy();
			// Settings reflected on preview.
			expect( await searchConfigure.isPreviewDarkTheme() ).toBeTruthy();
			expect( await searchConfigure.isPreviewFormatProduct() ).toBeTruthy();
			expect( await searchConfigure.isPreviewDefaultSortNewest() ).toBeTruthy();
		} );

		await test.step( 'Settings stick after reload', async () => {
			// Reload the page.
			await searchConfigure.reload();
			await searchConfigure.waitForNetworkIdle();

			// Settings do stick.
			expect( await searchConfigure.isDarkTheme() ).toBeTruthy();
			expect( await searchConfigure.isHighlightPink() ).toBeTruthy();
			expect( await searchConfigure.isFormatProduct() ).toBeTruthy();
			expect( await searchConfigure.isDefaultSortNewest() ).toBeTruthy();
			// Settings reflected on preview.
			expect( await searchConfigure.isPreviewDarkTheme() ).toBeTruthy();
			expect( await searchConfigure.isPreviewFormatProduct() ).toBeTruthy();
			expect( await searchConfigure.isPreviewDefaultSortNewest() ).toBeTruthy();
		} );
	} );
} );
