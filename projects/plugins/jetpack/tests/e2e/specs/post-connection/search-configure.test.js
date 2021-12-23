import { test, expect } from '../../fixtures/base-test.js';
import { SearchConfigure } from 'jetpack-e2e-commons/pages/wp-admin/index.js';
import {
	enableInstantSearch,
	disableInstantSearch,
	searchAPIRoute,
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
		await page.close();
	} );

	test.afterAll( async () => {
		await disableInstantSearch();
	} );

	test.beforeEach( async ( { page } ) => {
		searchConfigure = await SearchConfigure.visit( page );
		await searchAPIRoute( page );
		await searchConfigure.waitForNetworkIdle();
	} );

	test( 'Can save customized search overlay settings', async () => {
		await test.step( 'Change settings', async () => {
			await searchConfigure.chooseDarkTheme();
			await searchConfigure.choosePinkAsHighlightColor();
			await searchConfigure.chooseProductFormat();
			await searchConfigure.clickSaveButton();
			await searchConfigure.waitForTimeout( 3000000 );
		} );

		await test.step( 'Settings reflected on preview', async () => {} );

		await test.step( 'Settings stick after reload', async () => {
			await searchConfigure.reload();
			expect( await searchConfigure.isDarkTheme() ).toBeTruthy();
			expect( await searchConfigure.isHighlightPink() ).toBeTruthy();
			expect( await searchConfigure.isFormatProduct() ).toBeTruthy();
			expect( await searchConfigure.isPoweredByJetpackOff() ).toBeTruthy();
		} );
	} );
} );
