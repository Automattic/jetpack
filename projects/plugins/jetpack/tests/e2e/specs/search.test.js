/**
 * Internal dependencies
 */
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import { activateModule, execWpCommand } from '../lib/utils-helper';
import Homepage from '../lib/pages/homepage';
import { step } from '../lib/env/test-setup';
import {
	enableInstantSearch,
	setupSearchSidebarWidget,
	setResultFormat,
} from '../lib/search-helper';

describe( 'Search', () => {
	beforeAll( async () => {
		await syncJetpackPlanData( 'complete' );
		await activateModule( page, 'search' );
		await enableInstantSearch();
		await setupSearchSidebarWidget();
	} );

	afterAll( async () => {
		await execWpCommand( 'wp jetpack module deactivate search' );
	} );

	it( 'Can perform search with default settings', async () => {
		const homepage = await Homepage.visit( page );
		await homepage.registerRouteInterceptions();

		await step( 'Can open the overlay by entering a query', async () => {
			await homepage.focusSearchInput();
			await homepage.enterQuery();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
		} );

		await step( 'Can show search controls in the overlay', async () => {
			expect( await homepage.isSearchFormVisible() ).toBeTruthy();
			expect( await homepage.isSortingVisible() ).toBeTruthy();
			expect( await homepage.isFilteringOptionsVisible() ).toBeTruthy();
		} );

		await step( 'Can show search results in the overlay', async () => {
			expect( await homepage.isSearchResultVisible() ).toBeTruthy();
		} );

		await step( 'Can default show results by relevance', async () => {
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test1</mark> Record 1' );
		} );

		await step( 'Can edit query in search form', async () => {
			await homepage.enterQuery( 'test2' );
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 1' );
		} );

		await step( 'Can change sorting links', async () => {
			await homepage.chooseSortingLink( 'newest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isSortingLinkSelected( 'newest' ) ).toBeTruthy();
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );

			await homepage.chooseSortingLink( 'oldest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isSortingLinkSelected( 'oldest' ) ).toBeTruthy();
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 2' );
		} );

		await step( 'Can change filtering', async () => {
			await homepage.clickFilterCategory2();
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 2' );

			await homepage.clickFilterCategory2();
			await homepage.clickFilterTag3();
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );
		} );

		await step( 'Can close overlay by clicking the cross', async () => {
			await homepage.clickCrossToCloseOverlay();
			await homepage.wairForAnimationAndRendering();

			expect( await homepage.isOverlayVisible() ).toBeFalsy();
		} );
	} );

	it( 'Can open and close overlay', async () => {
		const homepage = await Homepage.visit( page );
		await homepage.registerRouteInterceptions();

		await step( 'Can press enter to to open overlay', async () => {
			await homepage.pressEnterInSearchInput();
			await homepage.wairForAnimationAndRendering();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
		} );

		await step( 'Can click the cross to close the overlay', async () => {
			await homepage.clickCrossToCloseOverlay();
			await homepage.wairForAnimationAndRendering();

			expect( await homepage.isOverlayVisible() ).toBeFalsy();
		} );
	} );

	it( 'Can reflect different result formats', async () => {
		let homepage;
		await step( 'Can use minimal format', async () => {
			await setResultFormat( 'minimal' );
			homepage = await Homepage.visit( page );
			await homepage.registerRouteInterceptions();

			await homepage.focusSearchInput();
			await homepage.enterQuery( 'test1' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isResultFormat( 'is-format-minimal' ) ).toBeTruthy();
		} );

		await step( 'Can use product format', async () => {
			await setResultFormat( 'product' );
			await homepage.reload();

			expect( await homepage.isResultFormat( 'is-format-product' ) ).toBeTruthy();
			expect( await homepage.isProductImageVisible() ).toBeTruthy();
			expect( await homepage.isProductPriceVisible() ).toBeTruthy();
		} );

		await step( 'Can use product format', async () => {
			await setResultFormat( 'expanded' );
			await homepage.reload();

			expect( await homepage.isResultFormat( 'is-format-expanded' ) ).toBeTruthy();
			expect( await homepage.isExpandedImageVisible() ).toBeTruthy();
		} );
	} );
} );
