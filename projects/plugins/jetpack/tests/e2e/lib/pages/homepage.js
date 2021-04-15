/**
 * Internal dependencies
 */
import WpPage from './wp-page';
import logger from '../logger';
import { searchResultForTest1, searchResultForTest2 } from '../search-helper';

export default class Homepage extends WpPage {
	static SEARCH_API_PATTERN = /^https:\/\/public-api\.wordpress.com\/rest\/v1.3\/sites\/\d+\/search.*/;

	constructor( page ) {
		const url = `${ siteUrl }/`;
		super( page, { expectedSelectors: [ '.site-title' ], url } );
	}

	searchAPIRoute() {
		return this.page.route( Homepage.SEARCH_API_PATTERN, ( route, request ) => {
			logger.info( `intercepted search API call: ${ request.url() }` );
			const url = new URL( request.url() );
			const params = url.searchParams;

			// load response for queries
			let body;
			switch ( params.get( 'query' ) ) {
				case 'test1':
					body = { ...searchResultForTest1 };
					break;
				case 'test2':
				default:
					body = { ...searchResultForTest2 };
					break;
			}

			// sorting
			switch ( params.get( 'sort' ) ) {
				case 'date_asc':
					// put record 2 first
					const tmpResult1 = body.results[ 0 ];
					body.results[ 0 ] = body.results[ 1 ];
					body.results[ 1 ] = tmpResult1;
					break;
				case 'date_desc':
					// put record 3 first
					const tmpResult2 = body.results[ 0 ];
					body.results[ 0 ] = body.results[ 2 ];
					body.results[ 2 ] = tmpResult2;
					break;
				case 'score_default':
				default:
					// the original sorting
					break;
			}

			// filtering
			// filter[bool][must][0][term][category.slug]=category-1
			// filter[bool][must][2][term][tag.slug]=tag-1

			const category = params.get( 'filter[bool][must][0][term][category.slug]' );
			const tag = params.get( 'filter[bool][must][0][term][tag.slug]' );

			if ( category ) {
				body.results = body.results.filter( v => v?.categories?.includes( category ) );
			}

			if ( tag ) {
				body.results = body.results.filter( v => v?.tags?.includes( tag ) );
			}

			route.fulfill( {
				content: 'application/json',
				headers: { 'Access-Control-Allow-Origin': '*' },
				body: JSON.stringify( body ),
			} );
		} );
	}

	async focusSearchInput() {
		const searchInputSelector = 'input.search-field';
		return this.focus( searchInputSelector );
	}

	async enterQuery( query = 'test1', clear = true ) {
		const searchInputSelector = 'input.search-field';
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
		const searchInputSelector = 'input.search-field';
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
		await this.page.waitForResponse( resp => Homepage.SEARCH_API_PATTERN.test( resp.url() ) );
		return await this.wairForAnimationAndRendering();
	}

	async wairForAnimationAndRendering() {
		return this.waitForTimeout( 500 );
	}

	async isSortingLinkSelected( sorting = 'relevance' ) {
		const sortingInputSelector = `.is-selected.jetpack-instant-search__search-sort-option[data-value="${ sorting }"]`;
		return this.isElementVisible( sortingInputSelector );
	}

	async isOverlayVisible() {
		const overlaySelector = '.jetpack-instant-search__overlay.is-hidden';
		return ! ( await this.isElementVisible( overlaySelector ) );
	}

	async isSearchResultVisible() {
		const searchResultTitleSelector = '.jetpack-instant-search__search-result';
		await this.waitForElementToBeAttached( searchResultTitleSelector );
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
}
