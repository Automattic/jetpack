import { flatten } from 'q-flat';
import { encode } from 'qss';

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object}      opts               - Options.
 * @param {number}      opts.siteId        - Site ID.
 * @param {string}      opts.searchQuery   - Search query string.
 * @param {string}      opts.sortOrder     - 'relevance' | 'date'.
 * @param {string|null} opts.pageHandle    - Cursor for pagination.
 * @param {boolean}     opts.isPrivateSite - Whether the site is private.
 * @param {boolean}     opts.isWpcom       - Whether the site runs on WordPress.com.
 * @param {string}      opts.apiRoot       - WordPress REST API root URL.
 * @param {string}      [opts.homeUrl]     - Home URL; required for private WPcom sites.
 * @return {string} Full URL to call.
 */
export function buildSearchUrl( {
	siteId,
	searchQuery,
	sortOrder,
	pageHandle,
	isPrivateSite,
	isWpcom,
	apiRoot,
	homeUrl = '',
} ) {
	const params = {
		query: encodeURIComponent( searchQuery || '' ),
		sort: sortOrder === 'date' ? 'date_desc' : 'score_default',
		size: 10,
	};

	if ( pageHandle ) {
		params.page_handle = pageHandle;
	}

	const queryString = encode( flatten( params ) );
	const path = `/sites/${ siteId }/search?${ queryString }`;

	if ( isPrivateSite && isWpcom ) {
		return `${ homeUrl }/wp-json/wpcom-origin/v1.3${ path }`;
	}
	if ( isPrivateSite ) {
		return `${ apiRoot }jetpack/v4/search?${ queryString }`;
	}
	return `https://public-api.wordpress.com/rest/v1.3${ path }`;
}
