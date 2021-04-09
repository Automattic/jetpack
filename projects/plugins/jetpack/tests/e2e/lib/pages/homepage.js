/**
 * Internal dependencies
 */
import WpPage from './wp-page';

export default class Homepage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/`;
		super( page, { expectedSelectors: [ '.post' ], url } );
	}

	static async init( page ) {
		const it = super.init( page );
		// await it.registerRouteInterceptions();
		return it;
	}

	async registerRouteInterceptions() {
		await this.searchAPIRoute();
	}

	static searchAPIRoute() {
		return page.route(
			/https:\/\/public-api.wordpress.com\/rest\/v1.3\/sites\/\d+\/search.*/,
			( route, request ) => {
				console.log( request.url() );
				route.fulfill( {
					content: 'application/json',
					headers: { 'Access-Control-Allow-Origin': '*' },
					body: '{}',
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
		const overlaySelector = '.jetpack-instant-search__box-gridicon';
		return this.isElementVisible( overlaySelector );
	}
}
