import { test, expect } from '../../fixtures/base-test.js';
import { SearchConfigure } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import {
	enableInstantSearch,
	searchAPIRoute,
	setTheme,
	setHighlightColor,
	setResultFormat,
} from '../../helpers/search-helper.js';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../../playwright.config.cjs';

test.describe( 'Search Configure', () => {
	let searchConfigure;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
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

		await page.close();
	} );

	test.beforeEach( async ( { page } ) => {
		searchConfigure = await SearchConfigure.visit( page );
		await searchAPIRoute( page );
		await searchConfigure.waitForNetworkIdle();
	} );

	test( 'Can change and reflect settings', async () => {
		await searchConfigure.chooseDarkTheme();
		await searchConfigure.choosePinkAsHighlightColor();
		await searchConfigure.chooseProductFormat();
		await searchConfigure.clickSaveButton();
		// Settings changed.
		expect( await searchConfigure.isDarkTheme() ).toBeTruthy();
		expect( await searchConfigure.isHighlightPink() ).toBeTruthy();
		expect( await searchConfigure.isFormatProduct() ).toBeTruthy();
		// Settings reflected on preview.
		expect( await searchConfigure.isPreviewDarkTheme() ).toBeTruthy();
		expect( await searchConfigure.isPreviewFormatProduct() ).toBeTruthy();
	} );

	test( 'Settings stick after reload', async () => {
		// Settings sticked.
		expect( await searchConfigure.isDarkTheme() ).toBeTruthy();
		expect( await searchConfigure.isHighlightPink() ).toBeTruthy();
		expect( await searchConfigure.isFormatProduct() ).toBeTruthy();
		// Settings reflected on preview.
		expect( await searchConfigure.isPreviewDarkTheme() ).toBeTruthy();
		expect( await searchConfigure.isPreviewFormatProduct() ).toBeTruthy();
	} );
} );
