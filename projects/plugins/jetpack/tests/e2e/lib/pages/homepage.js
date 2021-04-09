/**
 * Internal dependencies
 */
import WpPage from './wp-page';

export default class Homepage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/`;
		super( page, { expectedSelectors: [ '.post' ], url } );
	}

	async registerRouteInterceptions() {
		await this.searchAPIRoute();
	}

	searchAPIRoute() {
		return this.page.route(
			/^https:\/\/public-api.wordpress.com\/rest\/v1.3\/sites\/\d+\/search.*/,
			( route, request ) => {
				console.log( request.url() );
				route.fulfill( {
					content: 'application/json',
					headers: { 'Access-Control-Allow-Origin': '*' },
					path: __dirname + '/data/search-results.json',
				} );
			}
		);
	}

	focusSearchInput() {
		const searchInputSelector = 'input.search-field';
		return this.focus( searchInputSelector );
	}

	enterQuery( query = 'test' ) {
		const searchInputSelector = 'input.search-field';
		return this.fill( searchInputSelector, query );
	}

	isSearchResultOverlayVisible() {
		const overlaySelector = '.jetpack-instant-search__overlay';
		return this.isElementVisible( overlaySelector );
	}

	async isSearchResultAvailable() {
		const searchResultTitleSelector = '.jetpack-instant-search__search-result';
		await this.waitForNetworkIdle();
		return this.isElementVisible( searchResultTitleSelector );
	}
}
