import { flatten } from 'q-flat';
import { encode } from 'qss';

/**
 * Fields to request from the v1.3 Jetpack Search API. Without an explicit
 * `fields[]` list the API only returns `date` / `post_id`, so result cards
 * render blank.
 *
 * Image alt text is intentionally omitted — the result card's `<img>` is
 * decorative (the surrounding anchor is `aria-hidden` with the title link as
 * the accessible target), so `alt=""` is correct and requesting alt text
 * would only add response bytes.
 */
export const SEARCH_FIELDS = [
	'date',
	'permalink.url.raw',
	'post_type',
	'title.default',
	'has.image',
	'image.url.raw',
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
 * Resolve ES field names and bucket format for a given filterConfig.
 *
 * Mirrors src/instant-search/lib/api.js so deep links round-trip between
 * the instant-search overlay and Search 3.0 blocks: filter keys, aggregation
 * fields, and ES term fields must match exactly. Aggregations use the
 * `slug_slash_name` variants so each bucket carries both the slug (used as
 * the stored filter value) and the display label — no extra WP lookup on
 * the client.
 *
 * @param {object} config - FilterConfig entry from the store.
 * @return {{ aggField: string|null, filterField: string|null, bucketFormat: 'slash'|'plain' }} Resolved ES fields and bucket key format for the filter.
 */
export function resolveFilterFields( config ) {
	if ( ! config ) {
		return { aggField: null, filterField: null, bucketFormat: 'plain' };
	}
	switch ( config.filterType ) {
		case 'taxonomy': {
			const taxonomy = config.taxonomy;
			if ( taxonomy === 'category' ) {
				return {
					aggField: 'category.slug_slash_name',
					filterField: 'category.slug',
					bucketFormat: 'slash',
				};
			}
			if ( taxonomy === 'post_tag' ) {
				return {
					aggField: 'tag.slug_slash_name',
					filterField: 'tag.slug',
					bucketFormat: 'slash',
				};
			}
			if ( ! taxonomy ) {
				return { aggField: null, filterField: null, bucketFormat: 'slash' };
			}
			return {
				aggField: `taxonomy.${ taxonomy }.slug_slash_name`,
				filterField: `taxonomy.${ taxonomy }.slug`,
				bucketFormat: 'slash',
			};
		}
		case 'post_type':
			return { aggField: 'post_type', filterField: 'post_type', bucketFormat: 'plain' };
		case 'author':
			return {
				aggField: 'author_login_slash_name',
				filterField: 'author_login',
				bucketFormat: 'slash',
			};
	}
	return { aggField: null, filterField: null, bucketFormat: 'plain' };
}

/**
 * Build ES aggregation requests from the filterConfigs registered by each
 * filter-checkbox block's render.php.
 *
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } map.
 * @return {object} Aggregations payload for the v1.3 search API.
 */
export function buildAggregations( filterConfigs ) {
	const aggregations = {};
	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		const { aggField } = resolveFilterFields( config );
		if ( ! aggField ) {
			continue;
		}
		aggregations[ filterKey ] = {
			terms: { field: aggField, size: Math.max( 1, config.maxItems ?? 10 ) },
		};
	}
	return aggregations;
}

/**
 * Build the ES filter clause from active selections.
 *
 * Each selected value becomes a `term` clause against the configured
 * filterField. Within a single filter key, multiple values OR together
 * (selecting two categories broadens the result set) — across different
 * keys, clauses AND together. Note this diverges from the instant-search
 * overlay in `src/instant-search/lib/api.js`, which ANDs multi-value
 * selections into `bool.must` directly; here we wrap them in a
 * `bool.should` so the facet UX matches what users expect from modern
 * faceted search (click-to-broaden within a facet).
 *
 * @param {object} activeFilters - { [filterKey]: string[] } selections.
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } map.
 * @return {object|undefined} `{ bool: { must: [...] } }` or undefined when nothing selected.
 */
export function buildFilterClause( activeFilters, filterConfigs ) {
	const must = [];
	for ( const [ filterKey, values ] of Object.entries( activeFilters ?? {} ) ) {
		if ( ! Array.isArray( values ) || values.length === 0 ) {
			continue;
		}
		const { filterField } = resolveFilterFields( filterConfigs?.[ filterKey ] );
		if ( ! filterField ) {
			continue;
		}
		const terms = values.map( value => ( { term: { [ filterField ]: value } } ) );
		must.push( terms.length === 1 ? terms[ 0 ] : { bool: { should: terms } } );
	}
	return must.length ? { bool: { must } } : undefined;
}

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object}      opts                 - Options.
 * @param {number}      opts.siteId          - Site ID.
 * @param {string}      opts.searchQuery     - Search query string.
 * @param {string}      opts.sortOrder       - 'relevance' | 'newest' | 'oldest'.
 * @param {string|null} opts.pageHandle      - Cursor for pagination.
 * @param {boolean}     opts.isPrivateSite   - Whether the site is private.
 * @param {boolean}     opts.isWpcom         - Whether the site runs on WordPress.com.
 * @param {string}      opts.apiRoot         - WordPress REST API root URL.
 * @param {object}      [opts.activeFilters] - { [filterKey]: string[] } selected filters.
 * @param {object}      [opts.filterConfigs] - { [filterKey]: FilterConfig } registered filters.
 * @param {string}      [opts.homeUrl]       - Home URL; required for private WPcom sites.
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
	activeFilters = {},
	filterConfigs = {},
	homeUrl = '',
} ) {
	// `qss.encode()` runs `encodeURIComponent` on every value, so we pass the
	// raw query here. The instant-search code double-encodes (pre-encodes
	// before handing to qss), which works today only because the v1.3 API
	// silently tolerates it — queries with `&`, `+`, or non-ASCII characters
	// would otherwise search for the wrong string.
	const params = {
		query: searchQuery || '',
		sort: SORT_QUERY_MAP[ sortOrder ] ?? 'score_default',
		size: 10,
		fields: SEARCH_FIELDS,
		highlight_fields: HIGHLIGHT_FIELDS,
	};

	const aggregations = buildAggregations( filterConfigs );
	if ( Object.keys( aggregations ).length ) {
		params.aggregations = aggregations;
	}

	const filter = buildFilterClause( activeFilters, filterConfigs );
	if ( filter ) {
		params.filter = filter;
	}

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
