import Homepage from 'jetpack-e2e-commons/pages/search-homepage';
import {
	enableInstantSearch,
	getSidebarsWidgets,
	setupSidebarsWidgets,
	setupSearchWidget,
	disableInstantSearch,
	getBlockWidgets,
	setupBlockWidgets,
} from 'jetpack-e2e-commons/helpers/search-helper';
import { testStep } from 'jetpack-e2e-commons/reporters/reporter';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites';
import { Plans } from 'jetpack-e2e-commons/env/types';

/**
 *
 * @group post-connection
 * @group search
 */
describe( 'Search', () => {
	let homepage;
	let backupSidebarsWidgets;
	let backupBlockWidgets;

	beforeAll( async () => {
		await prerequisitesBuilder()
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.withActiveModules( [ 'search' ] )
			.build();

		backupSidebarsWidgets = await getSidebarsWidgets();
		backupBlockWidgets = await getBlockWidgets();
		await enableInstantSearch();
		await setupSidebarsWidgets();
		await setupSearchWidget();
		await setupBlockWidgets();
	} );

	afterAll( async () => {
		await setupSidebarsWidgets( backupSidebarsWidgets );
		await setupBlockWidgets( backupBlockWidgets );
		await disableInstantSearch();
	} );

	beforeEach( async () => {
		homepage = await Homepage.visit( page );
		await homepage.searchAPIRoute();
		await homepage.waitForNetworkIdle();
	} );

	it( 'Can perform search with default settings', async () => {
		await testStep( 'Can open the overlay by entering a query', async () => {
			await homepage.focusSearchInput();
			await homepage.enterQuery();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
		} );

		await testStep( 'Can show search controls in the overlay', async () => {
			expect( await homepage.isSearchFormVisible() ).toBeTruthy();
			expect( await homepage.isSortingVisible() ).toBeTruthy();
			expect( await homepage.isFilteringOptionsVisible() ).toBeTruthy();
		} );

		await testStep( 'Can show search results in the overlay', async () => {
			expect( await homepage.isSearchResultVisible() ).toBeTruthy();
		} );

		await testStep( 'Can sort results by relevance by default', async () => {
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test1</mark> Record 1' );
		} );

		await testStep( 'Can edit query in search form', async () => {
			await homepage.enterQueryToOverlay( 'test2' );
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 1' );
		} );

		await testStep( 'Can change sort order', async () => {
			await homepage.chooseSortingLink( 'newest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isSortingLinkSelected( 'newest' ) ).toBeTruthy();
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );

			await homepage.chooseSortingLink( 'oldest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isSortingLinkSelected( 'oldest' ) ).toBeTruthy();
			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 2' );
		} );

		await testStep( 'Can apply filters', async () => {
			await homepage.clickFilterCategory2();
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 2' );

			await homepage.clickFilterCategory2();
			await homepage.clickFilterTag3();
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );
		} );

		await testStep( 'Can close overlay by clicking the cross', async () => {
			await homepage.clickCrossToCloseOverlay();

			expect( await homepage.isOverlayVisible() ).toBeFalsy();
		} );
	} );

	it( 'Can open and close overlay', async () => {
		await testStep( 'Can press enter to to open overlay', async () => {
			await homepage.pressEnterInSearchInput();
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
		} );

		await testStep( 'Can click the cross to close the overlay', async () => {
			await homepage.clickCrossToCloseOverlay();

			expect( await homepage.isOverlayVisible() ).toBeFalsy();
		} );
	} );

	it( 'Can display different result formats', async () => {
		await testStep( 'Can use minimal format', async () => {
			await homepage.goto( `${ siteUrl }?result_format=minimal` );
			await homepage.waitForPage();
			await homepage.waitForNetworkIdle();
			await homepage.focusSearchInput();
			await homepage.enterQuery( 'random-string-1' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
			expect( await homepage.isResultFormat( 'is-format-minimal' ) ).toBeTruthy();
		} );

		await testStep( 'Can use product format', async () => {
			await homepage.goto( `${ siteUrl }?result_format=product` );
			await homepage.waitForPage();
			await homepage.waitForNetworkIdle();
			await homepage.focusSearchInput();
			await homepage.enterQuery( 'random-string-2' );
			await homepage.waitForSearchResponse();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
			expect( await homepage.isResultFormat( 'is-format-product' ) ).toBeTruthy();
			expect( await homepage.isProductImageVisible() ).toBeTruthy();
			expect( await homepage.isProductPriceVisible() ).toBeTruthy();
		} );

		await testStep( 'Can use expanded format', async () => {
			await homepage.goto( `${ siteUrl }?result_format=expanded&s=random-string-3` );
			await homepage.waitForPage();
			await homepage.waitForNetworkIdle();

			expect( await homepage.isOverlayVisible() ).toBeTruthy();
			expect( await homepage.isResultFormat( 'is-format-expanded' ) ).toBeTruthy();
			expect( await homepage.isExpandedImageVisible() ).toBeTruthy();
		} );
	} );
} );
