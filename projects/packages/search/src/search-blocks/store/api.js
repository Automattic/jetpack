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
		case 'wc_stock_status':
			// Reads WooCommerce-populated postmeta indexed under
			// `meta._stock_status.value` with a `.raw` keyword subfield via
			// the `meta_str_template` dynamic mapping. The terms-aggs
			// whitelist (`meta\..*\.value\.raw` in
			// class-wpcom-search-engine.php) admits this exact path. The
			// `wc_*` prefix on the filterType marks the dependency on
			// WC-populated meta even though no WC-side code is involved at
			// query time.
			return {
				aggField: 'meta._stock_status.value.raw',
				filterField: 'meta._stock_status.value.raw',
				bucketFormat: 'plain',
			};
		case 'wc_rating':
			// Reads WC's per-product `_wc_average_rating` meta. Aggregation
			// uses a histogram (range aggs aren't whitelisted on the
			// WPCOM v1.3 search API — `[aggs:range] is not whitelisted`)
			// with `interval: 1, offset: 0.5` so bucket boundaries fall on
			// half-integers, mirroring WC's `ROUND(avg_rating, 0)` star
			// cutoffs from FilterData::get_rating_counts. Filter clauses
			// use `range` per selected star, OR'd via `bool.should`.
			// `buildAggregations` and `buildFilterClause` special-case this
			// filterType because the standard `terms` agg / `term` clause
			// don't apply.
			return {
				aggField: 'meta._wc_average_rating.double',
				filterField: 'meta._wc_average_rating.double',
				bucketFormat: 'plain',
			};
	}
	return { aggField: null, filterField: null, bucketFormat: 'plain' };
}

/**
 * Star buckets for `wc_rating` filter clauses. Mirrors WC's
 * `ROUND(avg_rating, 0)` semantics: star=5 covers avg ∈ [4.5, ∞),
 * star=4 covers [3.5, 4.5), down to star=1 covering [0.5, 1.5).
 *
 * Products with `_wc_average_rating` < 0.5 fall into a histogram
 * bucket at -0.5 with no corresponding star entry — they're returned
 * in unfiltered results but cannot be selected via the rating filter.
 * This matches WC's own `ROUND(avg_rating, 0)` filter UI which has
 * no "0-star" option either; when the front-end filter block lands
 * (DSGWOO-equivalent on the Search 3.0 side) it will surface only the
 * 1–5 entries here.
 *
 * Aggregation uses a histogram (range aggs aren't whitelisted on the
 * WPCOM v1.3 search API). `histogramKey` is the bucket key the
 * histogram emits for that star band when called with `interval: 1`
 * and `offset: 0.5` — useful for response-side bucket → star
 * projection.
 */
export const WC_RATING_RANGES = [
	{ key: '1', from: 0.5, to: 1.5, histogramKey: 0.5 },
	{ key: '2', from: 1.5, to: 2.5, histogramKey: 1.5 },
	{ key: '3', from: 2.5, to: 3.5, histogramKey: 2.5 },
	{ key: '4', from: 3.5, to: 4.5, histogramKey: 3.5 },
	{ key: '5', from: 4.5, histogramKey: 4.5 },
];

/**
 * Build ES aggregation requests from the filterConfigs registered by each
 * filter-checkbox block's render.php.
 *
 * The `order` key maps the block's `bucketSortOrder` attribute to the ES
 * `terms` agg order clause: `count` → `{ _count: 'desc' }` (the ES default,
 * matched to the instant-search overlay), `alpha` → `{ _key: 'asc' }` which
 * sorts by the aggregation's slug_slash_name key. That's "good enough"
 * alphabetical for built-in variations since the slug typically leads with
 * the same letter as the display name; a label-accurate sort would require
 * a post-aggregation resort in the client.
 *
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } map.
 * @return {object} Aggregations payload for the v1.3 search API.
 */
export function buildAggregations( filterConfigs ) {
	const aggregations = {};
	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		// Rating gets a histogram aggregation. `range` aggs aren't
		// whitelisted on the v1.3 API; histogram interval=1 with offset=0.5
		// produces buckets keyed at .5 boundaries, mirroring WC's
		// ROUND(avg_rating) star buckets.
		if ( config?.filterType === 'wc_rating' ) {
			const { aggField: ratingField } = resolveFilterFields( config );
			aggregations[ filterKey ] = {
				histogram: {
					field: ratingField,
					interval: 1,
					offset: 0.5,
					min_doc_count: 0,
				},
			};
			continue;
		}

		const { aggField } = resolveFilterFields( config );
		if ( ! aggField ) {
			continue;
		}
		const order = config?.bucketSortOrder === 'alpha' ? { _key: 'asc' } : { _count: 'desc' };
		aggregations[ filterKey ] = {
			terms: {
				field: aggField,
				size: Math.max( 1, config.maxItems ?? 10 ),
				order,
			},
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
		const config = filterConfigs?.[ filterKey ];

		// Rating: each selected star level maps to a range clause on
		// the rating field resolved from the config; multiple selections OR.
		if ( config?.filterType === 'wc_rating' ) {
			const { filterField: ratingField } = resolveFilterFields( config );
			const ranges = values
				.map( value => WC_RATING_RANGES.find( r => r.key === String( value ) ) )
				.filter( Boolean )
				.map( r => {
					const range = { gte: r.from };
					if ( r.to !== undefined ) {
						range.lt = r.to;
					}
					return { range: { [ ratingField ]: range } };
				} );
			if ( ranges.length === 0 ) {
				continue;
			}
			must.push( ranges.length === 1 ? ranges[ 0 ] : { bool: { should: ranges } } );
			continue;
		}

		const { filterField } = resolveFilterFields( config );
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
 * @param {object|null} [opts.priceRange]    - `{ min, max }` numeric range against the
 *                                           `wc.price` ES field. Either bound may be null
 *                                           for a half-open range. Read by future product
 *                                           filter blocks driven by `min_price` / `max_price`
 *                                           URL params.
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
	priceRange = null,
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

	// `buildFilterClause` returns either `{ bool: { must: [...] } }` or
	// `undefined` — the spread below relies on that shape contract.
	let filter = buildFilterClause( activeFilters, filterConfigs );
	if ( priceRange && ( priceRange.min != null || priceRange.max != null ) ) {
		const range = {};
		if ( priceRange.min != null ) {
			range.gte = priceRange.min;
		}
		if ( priceRange.max != null ) {
			range.lte = priceRange.max;
		}
		const rangeClause = { range: { 'wc.price': range } };
		// Build a fresh wrapper rather than mutating the object returned by
		// `buildFilterClause` — safe today because that helper always returns
		// a freshly constructed object, but the non-mutating shape stays
		// correct if memoisation or caching is added later.
		filter = filter
			? { bool: { must: [ ...filter.bool.must, rangeClause ] } }
			: { bool: { must: [ rangeClause ] } };
	}
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
