import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export default class SearchHomepage extends WpPage {
	static SEARCH_API_PATTERN = /^https:\/\/public-api\.wordpress.com\/rest\/v1.3\/sites\/\d+\/search.*/;

	constructor( page ) {
		const url = `${ resolveSiteUrl() }/?result_format=expanded`;
		super( page, {
			expectedSelectors: [ '.wp-block-search__input, .search-field' ],
			url,
			explicitWaitMS: 30000,
		} );
	}

	async focusSearchInput() {
		const searchInputSelector = 'input.wp-block-search__input, input.search-field';
		return this.focus( searchInputSelector );
	}

	async enterQuery( query = 'test1', clear = true ) {
		const searchInputSelector = 'input.wp-block-search__input, input.search-field';
		if ( clear ) {
			await this.clear( searchInputSelector );
		}
		return this.fill( searchInputSelector, query );
	}

	async enterQueryToOverlay( query, clear = true ) {
		const searchInputSelector = 'input.jetpack-instant-search__box-input';
		if ( clear ) {
			await this.clear( searchInputSelector );
		}
		return this.fill( searchInputSelector, query );
	}

	async pressEnterInSearchInput() {
		const searchInputSelector = 'input.wp-block-search__input, input.search-field';
		return this.page.press( searchInputSelector, 'Enter' );
	}

	async chooseSortingOption( sorting = 'relevance' ) {
		const sortingInputSelector = '#jetpack-instant-search__search-sort-select';
		return this.selectOption( sortingInputSelector, sorting );
	}

	async chooseSortingLink( sorting = 'relevance' ) {
		const sortingInputSelector = `.jetpack-instant-search__search-sort-option[data-value="${ sorting }"]`;
		return this.click( sortingInputSelector );
	}

	async clickCrossToCloseOverlay() {
		const crossSelector = 'button.jetpack-instant-search__overlay-close';
		return this.click( crossSelector );
	}

	async clickFilterCategory2() {
		const category2Selector = '.jetpack-instant-search__search-filter-list-input[name=category-2]';
		return this.click( category2Selector );
	}

	async clickFilterTag3() {
		const tag3Selector = '.jetpack-instant-search__search-filter-list-input[name=tag-3]';
		return this.click( tag3Selector );
	}

	async waitForSearchResponse() {
		return this.page.waitForResponse( resp =>
			SearchHomepage.SEARCH_API_PATTERN.test( resp.url() )
		);
	}

	async waitForInstantSearchReady() {
		await this.waitForElementToBeAttached( '.jetpack-instant-search' );
		return await this.waitForTimeout( 500 );
	}

	async isSortingLinkSelected( sorting = 'relevance' ) {
		const sortingInputSelector = `.is-selected.jetpack-instant-search__search-sort-option[data-value="${ sorting }"]`;
		return this.isElementVisible( sortingInputSelector );
	}

	async isOverlayVisible() {
		const overlaySelector = '.jetpack-instant-search__overlay';
		await this.waitForTimeout( 500 );
		const classes = await this.page.$eval( overlaySelector, e => e.getAttribute( 'class' ) );
		return ! classes.includes( 'is-hidden' );
	}

	async isSearchResultVisible() {
		const searchResultTitleSelector = '.jetpack-instant-search__search-result';
		return this.isElementVisible( searchResultTitleSelector );
	}

	async getFirstResultTitle() {
		const resultTitleSelector = '.jetpack-instant-search__search-result-title-link';
		return this.page.innerHTML( resultTitleSelector );
	}

	async isSearchFormVisible() {
		const searchFormSelector = '.jetpack-instant-search__search-results-search-form';
		return this.isElementVisible( searchFormSelector );
	}

	async isSortingVisible() {
		const sortingSelector = '.jetpack-instant-search__search-sort';
		return this.isElementVisible( sortingSelector );
	}

	async isFilteringOptionsVisible() {
		const filteringSelector1 = '.jetpack-instant-search__search-filter-list-input[name=category-1]';
		const filteringSelector2 = '.jetpack-instant-search__search-filter-list-input[name=tag-1]';
		return (
			( await this.isElementVisible( filteringSelector1 ) ) &&
			( await this.isElementVisible( filteringSelector2 ) )
		);
	}

	async isResultFormat( subSelector ) {
		const resultListSelector = `.jetpack-instant-search__search-results-list.${ subSelector }`;
		return this.isElementVisible( resultListSelector );
	}

	async isProductImageVisible() {
		const productImageSelector = '.jetpack-instant-search__search-result-product-img';
		return this.isElementVisible( productImageSelector );
	}

	async isProductPriceVisible() {
		const productPriceSelector = '.jetpack-instant-search__product-price';
		return this.isElementVisible( productPriceSelector );
	}

	async isExpandedImageVisible() {
		const expandedImageSelector = '.jetpack-instant-search__search-result-expanded__image';
		return this.isElementVisible( expandedImageSelector );
	}

	async clickLink() {
		const linkSelector = '.wp-button.jetpack-search-filter__link';
		return this.click( linkSelector );
	}
}
