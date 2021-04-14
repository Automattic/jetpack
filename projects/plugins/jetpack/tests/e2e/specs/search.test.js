/**
 * Internal dependencies
 */
import { syncJetpackPlanData } from '../lib/flows/jetpack-connect';
import { activateModule, execMultipleWpCommands } from '../lib/utils-helper';
import Homepage from '../lib/pages/homepage';
import { step } from '../lib/env/test-setup';

describe( 'Search', () => {
	let homepage;

	beforeAll( async () => {
		const searchConfigDir = './wp-content/plugins/jetpack-dev/tests/e2e/config/search';
		await syncJetpackPlanData( 'complete' );
		await activateModule( page, 'search' );
		await execMultipleWpCommands( 'wp option update instant_search_enabled 1' );
		await execMultipleWpCommands(
			`wp option update sidebars_widgets --format=json <	${ searchConfigDir }/search-sidebars-widgets.json`
		);
		await execMultipleWpCommands(
			`wp option update widget_jetpack-search-filters --format=json <	${ searchConfigDir }/search-filters.json`
		);
	} );

	afterAll( async () => {
		await execMultipleWpCommands( 'wp jetpack module deactivate search' );
	} );

	beforeEach( async () => {
		homepage = await Homepage.visit( page );
		await homepage.registerRouteInterceptions();
	} );

	it( 'Can perform search with default settings', async () => {
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

		await step( 'Can change sorting', async () => {
			await homepage.clickSortingOption( 'newest' );
			await homepage.isSortOptionSelected( 'newest' );
			await homepage.waitForSearchResponse();

			expect( await homepage.getFirstResultTitle() ).toBe( '<mark>Test2</mark> Record 3' );

			await homepage.clickSortingOption( 'oldest' );
			await homepage.isSortOptionSelected( 'oldest' );
			await homepage.waitForSearchResponse();

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
		await step( 'Can press enter to to open overlay', async () => {
			await homepage.focusSearchInput();
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
} );
