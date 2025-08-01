import { Page } from '@playwright/test';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import {
	enableInstantSearch,
	disableInstantSearch,
	searchAPIRoute,
	searchAutoConfig,
	clearSearchPlanInfo,
	searchResultForTest1 as originalSearchResultForTest1,
	searchResultForTest2 as originalSearchResultForTest2,
} from '../helpers/search-helper.ts';

// Create deep copies to prevent mutations during tests
const searchResultForTest1 = JSON.parse( JSON.stringify( originalSearchResultForTest1 ) );
const searchResultForTest2 = JSON.parse( JSON.stringify( originalSearchResultForTest2 ) );

const SEARCH_API_PATTERN = /^https:\/\/public-api\.wordpress.com\/rest\/v1.3\/sites\/\d+\/search.*/;

/**
 * Returns the inner HTML of the first search result title.
 * @param {Page} page - instance of a Playwright Page type
 * @return {Promise<string>} The inner HTML of the first search result title.
 */
async function getFirstResultTitle( page: Page ): Promise< string > {
	const resultTitleSelector = '.jetpack-instant-search__search-result-title-link > span';
	return page.innerHTML( resultTitleSelector );
}

/**
 * Submits a search query in the search box.
 * @param {Page}   page  - instance of a Playwright Page type
 * @param {string} query - the search query to submit
 * @return {Promise<void>} - A promise that resolves when the search query is submitted.
 */
async function submitSearchQuery( page: Page, query: string ): Promise< void > {
	const searchResponsePromise = page.waitForResponse( resp =>
		SEARCH_API_PATTERN.test( resp.url() )
	);
	const searchBox = page.getByRole( 'searchbox', { name: 'Search' } );
	await searchBox.focus();
	await searchBox.clear();
	await searchBox.fill( query );
	await searchBox.press( 'Enter' );
	await searchResponsePromise;
}

test.describe( 'Instant Search', () => {
	test.beforeAll( async ( { testUtils } ) => {
		await clearSearchPlanInfo();
		await testUtils.activateModule( 'search' );
		await enableInstantSearch();
		await searchAutoConfig();
	} );

	test.afterAll( async () => {
		await disableInstantSearch();
	} );

	test.beforeEach( async ( { page } ) => {
		await searchAPIRoute( page );
	} );

	test( 'Can perform search with default settings', async ( { page } ) => {
		let searchResponsePromise;

		await page.goto( '/?result_format=expanded' );

		await test.step( 'Can open the overlay by entering a query', async () => {
			await submitSearchQuery( page, 'test1' );

			await expect(
				page.getByRole( 'dialog', { name: 'Search results' } ),
				'Overlay should be visible'
			).toBeVisible();
		} );

		await test.step( 'Can show search controls in the overlay', async () => {
			const sortingOptions = [ 'Relevance', 'Newest', 'Oldest' ];
			for ( const option of sortingOptions ) {
				await expect(
					page.getByRole( 'button', { name: option } ),
					`Sorting option "${ option }" should be visible`
				).toBeVisible();
			}
			await expect(
				page.getByRole( 'checkbox', { name: 'Category 1' } ),
				'Filtering by category options should be visible'
			).toBeVisible();
			await expect(
				page.getByRole( 'checkbox', { name: 'Tag 1' } ),
				'Filtering by tags options should be visible'
			).toBeVisible();
		} );

		await test.step( 'Can show search results in the overlay', async () => {
			await expect(
				page.locator( '.jetpack-instant-search__search-result' ),
				'Search results should be visible'
			).toHaveCount( searchResultForTest1.results.length );
		} );

		await test.step( 'Can sort results by relevance by default', async () => {
			expect(
				await getFirstResultTitle( page ),
				'First result title should match the expected value'
			).toEqual( searchResultForTest1.results[ 0 ].highlight.title[ 0 ] );
		} );

		const overlaySearchInput = page.getByRole( 'searchbox', {
			name: 'Magnifying Glass',
		} );

		await test.step( 'Can edit query and search for another term', async () => {
			await overlaySearchInput.clear();
			await overlaySearchInput.focus();
			searchResponsePromise = page.waitForResponse( resp => SEARCH_API_PATTERN.test( resp.url() ) );
			await overlaySearchInput.fill( 'test2' );
			await searchResponsePromise;
		} );

		await test.step( 'The first result is updated by relevance', async () => {
			expect(
				await getFirstResultTitle( page ),
				'First result title should match the most relevant value'
			).toBe( '<mark>Test2</mark> Record 1' );
		} );

		await test.step( 'Can change sort order', async () => {
			searchResponsePromise = page.waitForResponse( resp => SEARCH_API_PATTERN.test( resp.url() ) );
			await page.getByRole( 'button', { name: 'Newest' } ).click();
			await searchResponsePromise;

			await expect(
				page.locator(
					'.is-selected.jetpack-instant-search__search-sort-option[data-value="newest"]'
				),
				"'newest' sorting link should be selected"
			).toBeVisible();

			expect(
				await getFirstResultTitle( page ),
				`First result title should match the newest value: ${
					searchResultForTest2.results[ searchResultForTest2.results.length - 1 ].highlight
						.title[ 0 ]
				}`
			).toBe( '<mark>Test2</mark> Record 3' );

			searchResponsePromise = page.waitForResponse( resp => SEARCH_API_PATTERN.test( resp.url() ) );
			await page.getByRole( 'button', { name: 'Oldest' } ).click();
			await searchResponsePromise;

			await expect(
				page.locator(
					'.is-selected.jetpack-instant-search__search-sort-option[data-value="oldest"]'
				),
				"'oldest' sorting link should be selected"
			).toBeVisible();

			expect(
				await getFirstResultTitle( page ),
				'First result title should match the oldest value'
			).toBe( '<mark>Test2</mark> Record 2' );
		} );

		await test.step( 'Can apply filters', async () => {
			searchResponsePromise = page.waitForResponse( resp => SEARCH_API_PATTERN.test( resp.url() ) );
			await page.getByRole( 'checkbox', { name: 'Category 2' } ).check();
			await searchResponsePromise;

			expect(
				await getFirstResultTitle( page ),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 2' );

			searchResponsePromise = page.waitForResponse( resp => SEARCH_API_PATTERN.test( resp.url() ) );
			await page.getByRole( 'checkbox', { name: 'Category 2' } ).uncheck();
			await page.getByRole( 'checkbox', { name: 'Tag 3' } ).check();
			await searchResponsePromise;

			expect(
				await getFirstResultTitle( page ),
				'First result title should match the expected value'
			).toBe( '<mark>Test2</mark> Record 3' );
		} );

		await test.step( 'Can close overlay by clicking the cross', async () => {
			await page.getByRole( 'button', { name: 'Close search results' } ).click();

			await expect(
				page.locator( '.jetpack-instant-search__overlay' ),
				'Overlay should not be visible'
			).toBeHidden();
		} );
	} );

	test( 'Can display different result formats', async ( { page } ) => {
		await test.step( 'Can use minimal format', async () => {
			await page.goto( `/?result_format=minimal` );
			await submitSearchQuery( page, 'random-string-1' );

			await expect(
				page.locator( '.jetpack-instant-search__search-results-list.is-format-minimal' ),
				"Results format should be 'minimal'"
			).toBeVisible();
		} );

		await test.step( 'Can use product format', async () => {
			await page.goto( `/?result_format=product` );
			await submitSearchQuery( page, 'random-string-2' );

			await expect(
				page.locator( '.jetpack-instant-search__search-results-list.is-format-product' ),
				"Results format should be 'product'"
			).toBeVisible();

			await expect(
				page.locator( '.jetpack-instant-search__search-result-product-img' ),
				'Product image should be visible'
			).toHaveCount( searchResultForTest2.results.length );

			await expect(
				page.locator( '.jetpack-instant-search__product-price' ),
				'Product price should be visible'
			).toHaveCount( searchResultForTest2.results.length );
		} );

		await test.step( 'Can use expanded format', async () => {
			await page.goto( `/?result_format=expanded` );
			await submitSearchQuery( page, 'random-string-3' );

			await expect(
				page.locator( '.jetpack-instant-search__search-results-list.is-format-expanded' ),
				"Results format should be 'expanded'"
			).toBeVisible();

			await expect(
				page.locator( '.jetpack-instant-search__search-result-expanded__image' ),
				'Expanded image should be visible'
			).toHaveCount( searchResultForTest2.results.length );
		} );
	} );

	test( 'Can open overlay by clicking a link', async ( { page } ) => {
		await page.goto( `/?jetpack_search_link_in_footer=1` );

		await expect(
			page.getByRole( 'dialog', { name: 'Search results' } ),
			'Overlay should not be visible'
		).toBeHidden();

		await page.getByRole( 'link', { name: 'Click to search' } ).click();

		await expect(
			page.getByRole( 'dialog', { name: 'Search results' } ),
			'Overlay should be visible'
		).toBeVisible();
	} );
} );
