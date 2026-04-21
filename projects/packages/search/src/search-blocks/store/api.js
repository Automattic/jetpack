import { flatten } from 'q-flat';
import { encode } from 'qss';

/**
 * Fields to request from the v1.3 Jetpack Search API. Without an explicit
 * `fields[]` list the API only returns `date` / `post_id`, so result cards
 * render blank. Keep this in sync with Search_Blocks::SEARCH_FIELDS in PHP.
 */
export const SEARCH_FIELDS = [
	'date',
	'permalink.url.raw',
	'post_type',
	'title.default',
	'has.image',
	'image.url.raw',
	'image.alt_text',
];

export const HIGHLIGHT_FIELDS = [ 'title', 'content' ];

/**
 * Maps Search 3.0 sort UI values to the v1.3 API `sort` parameter. Keep the
 * UI keys aligned with src/instant-search/lib/constants.js SORT_OPTIONS so
 * the two surfaces stay interoperable.
 */
const SORT_QUERY_MAP = {
	newest: 'date_desc',
	oldest: 'date_asc',
	relevance: 'score_default',
};

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object}      opts               - Options.
 * @param {number}      opts.siteId        - Site ID.
 * @param {string}      opts.searchQuery   - Search query string.
 * @param {string}      opts.sortOrder     - 'relevance' | 'newest' | 'oldest'.
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
		sort: SORT_QUERY_MAP[ sortOrder ] ?? 'score_default',
		size: 10,
		fields: SEARCH_FIELDS,
		highlight_fields: HIGHLIGHT_FIELDS,
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
