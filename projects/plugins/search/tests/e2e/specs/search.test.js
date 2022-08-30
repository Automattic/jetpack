import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { SearchHomepage } from '../pages/index.js';
import {
	enableInstantSearch,
	disableInstantSearch,
	searchAPIRoute,
	searchAutoConfig,
	clearSearchPlanInfo,
} from '../helpers/search-helper.js';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import playwrightConfig from '../playwright.config.cjs';

test.describe( 'Instant Search', () => {
	let homepage;
	const siteUrl = resolveSiteUrl();

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
		await searchAutoConfig();
		await page.close();
	} );

	test.afterAll( async () => {
		await disableInstantSearch();
	} );

	test.beforeEach( async ( { page } ) => {
		await searchAPIRoute( page );
		homepage = await SearchHomepage.visit( page );
		await homepage.waitForInstantSearchReady();
	} );

	test( 'Can perform search with default settings', async () => {
		await test.step( 'Can open the overlay by entering a query', async () => {
			await homepage.focusSearchInput();
			await homepage.enterQuery();
			await homepage.pressEnterInSearchInput();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible(), 'Overlay should be visible' ).toBeTruthy();
		} );

		await test.step( 'Can show search controls in the overlay', async () => {
			expect( await homepage.isSearchFormVisible(), 'Search form should be visible' ).toBeTruthy();
			expect( await homepage.isSortingVisible(), 'Sorting options should be visible' ).toBeTruthy();
			expect(
				await homepage.isFilteringOptionsVisible(),
				'Filtering options should be visible'
			).toBeTruthy();
		} );

		await test.step( 'Can show search results in the overlay', async () => {
			expect(
				await homepage.isSearchResultVisible(),
				'Search results should be visible'
			).toBeTruthy();
		} );

		await test.step( 'Can sort results by relevance by default', async () => {
			expect(
				await homepage.getFirstResultTitle(),
				'First result title should match the expected value'
			).toBe( '<mark>Test1</mark> Record 1' );
		} );

		await test.step( 'Can edit query in search form', async () => {
			await homepage.enterQueryToOverlay( 'test2' );
			await homepage.waitForSearchResponse();

			expect(
				await homepage.getFirstResultTitle(),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 1' );
		} );

		await test.step( 'Can change sort order', async () => {
			await homepage.chooseSortingLink( 'newest' );
			await homepage.waitForSearchResponse();

			expect(
				await homepage.isSortingLinkSelected( 'newest' ),
				"'newest' sorting link should be selected"
			).toBeTruthy();
			expect(
				await homepage.getFirstResultTitle(),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 3' );

			await homepage.chooseSortingLink( 'oldest' );
			await homepage.waitForSearchResponse();

			expect(
				await homepage.isSortingLinkSelected( 'oldest' ),
				"'oldest' sorting link should be selected"
			).toBeTruthy();
			expect(
				await homepage.getFirstResultTitle(),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 2' );
		} );

		await test.step( 'Can apply filters', async () => {
			await homepage.clickFilterCategory2();
			await homepage.waitForSearchResponse();

			expect(
				await homepage.getFirstResultTitle(),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 2' );

			await homepage.clickFilterCategory2();
			await homepage.clickFilterTag3();
			await homepage.waitForSearchResponse();

			expect(
				await homepage.getFirstResultTitle(),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 3' );
		} );

		await test.step( 'Can close overlay by clicking the cross', async () => {
			await homepage.clickCrossToCloseOverlay();

			expect( await homepage.isOverlayVisible(), 'Overlay should not be visible' ).toBeFalsy();
		} );
	} );

	test( 'Can open and close overlay', async () => {
		await test.step( 'Can press enter to to open overlay', async () => {
			await homepage.pressEnterInSearchInput();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible(), 'Overlay should be visible' ).toBeTruthy();
		} );

		await test.step( 'Can click the cross to close the overlay', async () => {
			await homepage.clickCrossToCloseOverlay();

			expect( await homepage.isOverlayVisible(), 'Overlay should not be visible' ).toBeFalsy();
		} );
	} );

	test( 'Can display different result formats', async () => {
		await test.step( 'Can use minimal format', async () => {
			await homepage.goto( `${ siteUrl }?result_format=minimal` );
			await homepage.waitForInstantSearchReady();
			await homepage.focusSearchInput();
			await homepage.enterQuery( 'random-string-1' );
			await homepage.pressEnterInSearchInput();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible(), 'Overlay should be visible' ).toBeTruthy();
			expect(
				await homepage.isResultFormat( 'is-format-minimal' ),
				"Results format should be 'minimal'"
			).toBeTruthy();
		} );

		await test.step( 'Can use product format', async () => {
			await homepage.goto( `${ siteUrl }?result_format=product` );
			await homepage.waitForInstantSearchReady();
			await homepage.focusSearchInput();
			await homepage.enterQuery( 'random-string-2' );
			await homepage.pressEnterInSearchInput();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible(), 'Overlay should be visible' ).toBeTruthy();
			expect(
				await homepage.isResultFormat( 'is-format-product' ),
				"Results format should be 'product'"
			).toBeTruthy();
			expect(
				await homepage.isProductImageVisible(),
				'Product image should be visible'
			).toBeTruthy();
			expect(
				await homepage.isProductPriceVisible(),
				'Product price should be visible'
			).toBeTruthy();
		} );

		await test.step( 'Can use expanded format', async () => {
			await homepage.goto( `${ siteUrl }?result_format=expanded&s=random-string-3` );
			await homepage.waitForInstantSearchReady();

			expect( await homepage.isOverlayVisible(), 'Overlay should be visible' ).toBeTruthy();
			expect(
				await homepage.isResultFormat( 'is-format-expanded' ),
				"Results format should be 'expanded'"
			).toBeTruthy();
			expect(
				await homepage.isExpandedImageVisible(),
				'Expanded image should be visible'
			).toBeTruthy();
		} );
	} );

	test( 'Can open overlay by clicking a link', async () => {
		await homepage.goto( `${ siteUrl }?jetpack_search_link_in_footer=1` );
		await homepage.waitForInstantSearchReady();

		expect( await homepage.isOverlayVisible(), 'Overlay should not be visible' ).toBeFalsy();
		await homepage.clickLink();
		await homepage.waitForSearchResponse();
		expect( await homepage.isOverlayVisible(), 'Overlay should be visible' ).toBeTruthy();
	} );
} );
