import { test, expect } from '../../fixtures/base-test.js';
import { SearchHomepage } from 'jetpack-e2e-commons/pages/index.js';
import {
	enableInstantSearch,
	disableInstantSearch,
	searchAPIRoute,
	searchAutoConfig,
	clearSearchPlanInfo,
} from '../../helpers/search-helper.js';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import playwrightConfig from '../../playwright.config.cjs';

test.describe( 'Instant Search', () => {
	const siteUrl = resolveSiteUrl();
	let homepage;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await clearSearchPlanInfo();
		await prerequisitesBuilder( page )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.withActiveModules( [ 'search' ] )
			.build();

		await searchAutoConfig();
		await enableInstantSearch();
		await page.close();
	} );

	test.afterAll( async () => {
		// await disableInstantSearch();
	} );

	test( 'Can search using default settings', async ( { page } ) => {
		await searchAPIRoute( page );
		homepage = await SearchHomepage.visit( page );
		await homepage.waitForNetworkIdle();

		await test.step( 'Can open the overlay by entering a query', async () => {
			await homepage.focusSearchInput();
			await homepage.enterQuery();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
		} );

		await test.step( 'Can show search controls in the overlay', async () => {
			expect( await homepage.isSearchFormVisible() ).toBeTruthy();
			expect( await homepage.isSortingVisible() ).toBeTruthy();
			expect( await homepage.isFilteringOptionsVisible() ).toBeTruthy();
		} );

		await test.step( 'Can show search results in the overlay', async () => {
			expect( await homepage.isSearchResultVisible() ).toBeTruthy();
		} );

		await test.step( 'Can sort results by relevance by default', async () => {
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test1</mark> Record 1' );
		} );

		await test.step( 'Can edit query in search form', async () => {
			await homepage.enterQueryToOverlay( 'test2' );
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 1' );
		} );

		await test.step( 'Can change sort order', async () => {
			await homepage.chooseSortingLink( 'newest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isSortingLinkSelected( 'newest' ) ).toBeTruthy();
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );

			await homepage.chooseSortingLink( 'oldest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isSortingLinkSelected( 'oldest' ) ).toBeTruthy();
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 2' );
		} );

		await test.step( 'Can apply filters', async () => {
			await homepage.clickFilterCategory2();
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 2' );

			await homepage.clickFilterCategory2();
			await homepage.clickFilterTag3();
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );

			await homepage.clickCrossToCloseOverlay();

			expect( await homepage.isOverlayVisible() ).toBeFalsy();
		} );
	} );

	test( 'Can press enter to to open overlay', async () => {
		await homepage.goto( `${ siteUrl }` );
		await homepage.waitForNetworkIdle();

		await homepage.pressEnterInSearchInput();
		await homepage.waitForSearchResponse();

		expect( await homepage.isOverlayVisible() ).toBeTruthy();

		await homepage.clickCrossToCloseOverlay();

		expect( await homepage.isOverlayVisible() ).toBeFalsy();
	} );

	test( 'Can use minimal format', async () => {
		await homepage.goto( `${ siteUrl }?result_format=minimal` );
		await homepage.waitForNetworkIdle();
		await homepage.focusSearchInput();
		await homepage.enterQuery( 'random-string-1' );
		await homepage.waitForSearchResponse();

		expect( await homepage.isOverlayVisible() ).toBeTruthy();
		expect( await homepage.isResultFormat( 'is-format-minimal' ) ).toBeTruthy();
	} );

	test( 'Can use product format', async () => {
		await homepage.goto( `${ siteUrl }?result_format=product` );
		await homepage.waitForNetworkIdle();
		await homepage.focusSearchInput();
		await homepage.enterQuery( 'random-string-2' );
		await homepage.waitForSearchResponse();

		expect( await homepage.isOverlayVisible() ).toBeTruthy();
		expect( await homepage.isResultFormat( 'is-format-product' ) ).toBeTruthy();
		expect( await homepage.isProductImageVisible() ).toBeTruthy();
		expect( await homepage.isProductPriceVisible() ).toBeTruthy();
	} );

	test( 'Can use expanded format', async () => {
		await homepage.goto( `${ siteUrl }?result_format=expanded&s=random-string-3` );
		await homepage.waitForSearchResponse();

		expect( await homepage.isOverlayVisible() ).toBeTruthy();
		expect( await homepage.isResultFormat( 'is-format-expanded' ) ).toBeTruthy();
		expect( await homepage.isExpandedImageVisible() ).toBeTruthy();
	} );

	test( 'Can open overlay by clicking a link', async () => {
		await homepage.goto( `${ siteUrl }?jetpack_search_link_in_footer=1` );
		await homepage.waitForNetworkIdle();

		expect( await homepage.isOverlayVisible() ).toBeFalsy();
		await homepage.clickLink();
		await homepage.waitForSearchResponse();
		expect( await homepage.isOverlayVisible() ).toBeTruthy();
	} );
} );
