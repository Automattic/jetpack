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
 *
 * The `wc.*` and `meta._wc_*` entries hydrate the product layout. Always
 * requested rather than gated on layout because the store fetches once per
 * page and any block can render a different layout — the response delta is
 * a few hundred bytes per result.
 */
export const SEARCH_FIELDS = [
	'date',
	'permalink.url.raw',
	'post_type',
	'title.default',
	'has.image',
	'image.url.raw',
	'wc.formatted_price',
	'wc.formatted_regular_price',
	'wc.formatted_sale_price',
	'meta._wc_average_rating.double',
	'meta._wc_review_count.long',
];

export const HIGHLIGHT_FIELDS = [ 'title', 'content' ];

/**
 * Maps Search 3.0 sort UI values to the v1.3 API `sort` parameter. Keep the
 * UI keys aligned with src/instant-search/lib/constants.js SORT_OPTIONS so
 * the two surfaces stay interoperable.
 *
 * Only contains the keys the API expects under a *different* name. The
 * product-format keys (`rating_desc`, `price_asc`, `price_desc`) are passed
 * through as-is by `mapSortToApiValue()` because the API accepts them
 * verbatim — same contract as instant-search's `mapSortToApiValue` in
 * src/instant-search/lib/api.js.
 */
const SORT_QUERY_MAP = {
	newest: 'date_desc',
	oldest: 'date_asc',
	relevance: 'score_default',
};

/**
 * Sort keys the v1.3 API accepts unchanged. Mirrors the early-return pool in
 * src/instant-search/lib/api.js → `mapSortToApiValue`.
 */
const SORT_PASSTHROUGH = new Set( [ 'rating_desc', 'price_asc', 'price_desc' ] );

/**
 * Translate a Search 3.0 store `sortOrder` to the API's `sort` value.
 *
 * @param {string} sortOrder - UI-side sort key.
 * @return {string} API-side sort value.
 */
function mapSortToApiValue( sortOrder ) {
	if ( SORT_PASSTHROUGH.has( sortOrder ) ) {
		return sortOrder;
	}
	return SORT_QUERY_MAP[ sortOrder ] ?? 'score_default';
}

// Mirrors Filter_Date::ALLOWED_INTERVALS. Doubles as the gate in
// buildAggregations — ES 400s on unknown intervals.
const DATE_HISTOGRAM_FORMATS = {
	year: 'yyyy',
	month: 'yyyy-MM',
};

const DATE_AGG_ORDERS = {
	newest: { _key: 'desc' },
	oldest: { _key: 'asc' },
	count: { _count: 'desc' },
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
 * `bucketFormat`: `slash` splits on the first `/`, `plain` uses the key as
 * both value and label, `date` uses the bucket's `key_as_string` and a
 * locale-aware label from `formatDateBucketLabel`.
 *
 * @param {object} config - FilterConfig entry from the store.
 * @return {{ aggField: string|null, filterField: string|null, bucketFormat: 'slash'|'plain'|'date' }} Resolved fields.
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
			// Stock status reads from the WC `product_visibility` taxonomy:
			// WC tags out-of-stock products with the `outofstock` term;
			// absence of that term means in-stock. The taxonomy has no
			// `instock` or `onbackorder` term, so this filter is two-state
			// only — backorder lives exclusively in the `_stock_status`
			// postmeta which the WPCOM-side ES indexer doesn't currently
			// carry (sync sends it, the indexer drops it; tracked as a
			// separate followup). `buildAggregations` and `buildFilterClause`
			// special-case this filterType because the agg needs an
			// `include: ['outofstock']` filter (the taxonomy holds many
			// unrelated terms — `featured`, `rated-N`, etc.) and the
			// in-stock selection emits a `must_not` clause rather than a
			// `term`.
			return {
				aggField: 'taxonomy.product_visibility.slug',
				filterField: 'taxonomy.product_visibility.slug',
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
		case 'date':
			// WPCOM v1.3 only whitelists `date` for date_histogram + range.
			return { aggField: 'date', filterField: 'date', bucketFormat: 'date' };
	}
	return { aggField: null, filterField: null, bucketFormat: 'plain' };
}

/**
 * Threshold lower bounds for the `wc_rating` filter — `?rating_filter[]=N`
 * matches `_wc_average_rating ≥ N - 0.5`, i.e. avg values that round to
 * N stars or higher under WC's `ROUND(avg_rating, 0)` rule. Half-integer
 * boundaries are deliberate: `4★ & up` includes products with avg ≥ 3.5
 * (which round to 4 or 5), so the row is a true "and up" superset of the
 * higher-star rows.
 *
 * Single-bound by design — there is no upper cap, mirroring the dominant
 * shopper-facing rating filter on Amazon/Etsy/Wayfair/Walmart/eBay where
 * picking "3★ & up" returns everything from 3 stars to perfect.
 *
 * Products with `_wc_average_rating` < 0.5 fall into a histogram
 * bucket at -0.5 with no corresponding star entry — they're returned
 * in unfiltered results but cannot be selected via the rating filter,
 * matching WC's own filter UI which has no "0-star" option.
 */
export const WC_RATING_RANGES = [
	{ key: '1', from: 0.5 },
	{ key: '2', from: 1.5 },
	{ key: '3', from: 2.5 },
	{ key: '4', from: 3.5 },
	{ key: '5', from: 4.5 },
];

/**
 * Build ES aggregation requests from the filterConfigs registered by each
 * filter block's render.php.
 *
 * `terms` for filter-checkbox: `alpha` → `_key: asc` is just a hint; the
 * shared store's `checkboxFilterItems` resorts by visible label so slug
 * and display name can diverge (e.g. `food-news` → "Restaurant Reviews").
 *
 * `date_histogram` for filter-date: format request makes `key_as_string`
 * match the URL slug. No `size`; the client slices to `maxItems`.
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

		// Stock status: probe only the `outofstock` term on
		// `product_visibility` — the in-stock count is derived as
		// `total - outofstock` on the read side. The `include` keeps
		// unrelated terms in the taxonomy (`featured`, `rated-N`,
		// `exclude-from-catalog`) out of the response.
		if ( config?.filterType === 'wc_stock_status' ) {
			const { aggField: stockField } = resolveFilterFields( config );
			aggregations[ filterKey ] = {
				terms: {
					field: stockField,
					include: [ 'outofstock' ],
					size: 1,
				},
			};
			continue;
		}

		const { aggField } = resolveFilterFields( config );
		if ( ! aggField ) {
			continue;
		}
		if ( config?.filterType === 'date' ) {
			const interval = DATE_HISTOGRAM_FORMATS[ config.interval ] ? config.interval : 'year';
			const order = DATE_AGG_ORDERS[ config.bucketSortOrder ] ?? DATE_AGG_ORDERS.newest;
			aggregations[ filterKey ] = {
				date_histogram: {
					field: aggField,
					calendar_interval: interval,
					format: DATE_HISTOGRAM_FORMATS[ interval ],
					min_doc_count: 1,
					order,
				},
			};
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
 * Translate a date filter slug into half-open `[gte, lt)` bounds for ES.
 * `lt` over `lte` avoids the off-by-one between adjacent buckets.
 *
 * @param {string} value    - `2024` or `2024-03`.
 * @param {string} interval - 'year' | 'month'.
 * @return {{ gte: string, lt: string }|null} null when the slug doesn't parse.
 */
function dateRangeFromSlug( value, interval ) {
	if ( interval === 'year' ) {
		const year = Number.parseInt( value, 10 );
		if ( ! Number.isFinite( year ) || String( year ) !== value ) {
			return null;
		}
		return {
			gte: `${ year }-01-01`,
			lt: `${ year + 1 }-01-01`,
		};
	}
	if ( interval === 'month' ) {
		const match = /^(\d{4})-(\d{2})$/.exec( value );
		if ( ! match ) {
			return null;
		}
		const year = Number.parseInt( match[ 1 ], 10 );
		const month = Number.parseInt( match[ 2 ], 10 );
		if ( month < 1 || month > 12 ) {
			return null;
		}
		const nextYear = month === 12 ? year + 1 : year;
		const nextMonth = month === 12 ? 1 : month + 1;
		const pad = n => String( n ).padStart( 2, '0' );
		return {
			gte: `${ year }-${ pad( month ) }-01`,
			lt: `${ nextYear }-${ pad( nextMonth ) }-01`,
		};
	}
	return null;
}

/**
 * Build the ES filter clause from active selections.
 *
 * Default: OR within a single filter key (`bool.should`); AND across keys
 * (`bool.must`). Diverges from the legacy instant-search overlay which ANDs
 * multi-value selections — Search 3.0 follows the broaden-on-click UX of
 * modern faceted search.
 *
 * Taxonomy filters can opt into AND semantics via `config.queryType === 'and'`
 * (set by the filter-checkbox "Logic" inspector toggle). In that case the
 * per-value `term` clauses are pushed as separate top-level `must` entries
 * rather than wrapped in `bool.should`, so the post must carry every selected
 * term. Only honoured for the `taxonomy` filterType — see
 * `Filter_Checkbox::normalize_query_type()`.
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

		// Stock status: two-state filter against the `outofstock` term on
		// `product_visibility`. `outofstock` selection narrows to products
		// carrying that term; `instock` excludes them via `must_not`;
		// selecting both is equivalent to no constraint, so the clause is
		// dropped (otherwise the term + must_not term contradict and ES
		// would return zero results).
		if ( config?.filterType === 'wc_stock_status' ) {
			const set = new Set( values.map( v => String( v ) ) );
			const wantsOut = set.has( 'outofstock' );
			const wantsIn = set.has( 'instock' );
			if ( wantsOut === wantsIn ) {
				continue;
			}
			const { filterField: stockField } = resolveFilterFields( config );
			const term = { term: { [ stockField ]: 'outofstock' } };
			must.push( wantsOut ? term : { bool: { must_not: [ term ] } } );
			continue;
		}

		// Rating: each selected star level maps to a `≥ N - 0.5` range
		// clause. The block is single-select so `values` is normally one
		// entry; tolerate multi-value URLs by OR-ing, which under threshold
		// semantics collapses to the lowest selected threshold (a no-op
		// vs. picking just that one) — harmless and keeps stale deep links
		// functional.
		if ( config?.filterType === 'wc_rating' ) {
			const { filterField: ratingField } = resolveFilterFields( config );
			const ranges = values
				.map( value => WC_RATING_RANGES.find( r => r.key === String( value ) ) )
				.filter( Boolean )
				.map( r => ( { range: { [ ratingField ]: { gte: r.from } } } ) );
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
		let clauses;
		if ( config?.filterType === 'date' ) {
			const interval = DATE_HISTOGRAM_FORMATS[ config.interval ] ? config.interval : 'year';
			clauses = values
				.map( value => {
					const range = dateRangeFromSlug( value, interval );
					return range ? { range: { [ filterField ]: range } } : null;
				} )
				.filter( Boolean );
		} else {
			clauses = values.map( value => ( { term: { [ filterField ]: value } } ) );
		}
		if ( clauses.length === 0 ) {
			continue;
		}
		// AND semantics only apply to taxonomy filters — see header docblock.
		// For a single value the wrapping is irrelevant, so the early single-clause
		// short-circuit covers both branches.
		if ( clauses.length === 1 ) {
			must.push( clauses[ 0 ] );
		} else if ( config?.queryType === 'and' && config?.filterType === 'taxonomy' ) {
			must.push( ...clauses );
		} else {
			must.push( { bool: { should: clauses } } );
		}
	}
	return must.length ? { bool: { must } } : undefined;
}

// Memoized: `filterItems` re-runs on every state read and may invoke
// `formatDateBucketLabel` once per bucket.
const monthLabelFormatters = new Map();

/**
 * Format a date filter bucket value as a localized display label.
 *
 * @param {string} value    - Bucket slug (`2024`, `2024-03`).
 * @param {string} interval - 'year' | 'month'.
 * @param {string} [locale] - BCP47 locale (default `en-US`).
 * @return {string} Display label, or the raw value if it can't be parsed.
 */
export function formatDateBucketLabel( value, interval, locale = 'en-US' ) {
	if ( typeof value !== 'string' || value === '' ) {
		return '';
	}
	if ( interval !== 'month' ) {
		return value;
	}
	const match = /^(\d{4})-(\d{2})$/.exec( value );
	if ( ! match ) {
		return value;
	}
	const month = Number.parseInt( match[ 2 ], 10 );
	if ( month < 1 || month > 12 ) {
		return value;
	}
	const formatter = getMonthLabelFormatter( locale || 'en-US' );
	if ( ! formatter ) {
		return value;
	}
	const year = Number.parseInt( match[ 1 ], 10 );
	// Date.UTC + `timeZone: 'UTC'` prevents month-rollback on negative-offset locales.
	return formatter.format( new Date( Date.UTC( year, month - 1, 1 ) ) );
}

/**
 * Cached `Intl.DateTimeFormat` for month labels.
 *
 * @param {string} locale - BCP47 locale tag.
 * @return {Intl.DateTimeFormat|null} null when the tag is malformed.
 */
function getMonthLabelFormatter( locale ) {
	let formatter = monthLabelFormatters.get( locale );
	if ( formatter ) {
		return formatter;
	}
	try {
		formatter = new Intl.DateTimeFormat( locale, {
			year: 'numeric',
			month: 'long',
			timeZone: 'UTC',
		} );
	} catch {
		return null;
	}
	monthLabelFormatters.set( locale, formatter );
	return formatter;
}

/**
 * Build the ES `bool.must` clauses contributed by the hidden
 * `jetpack-search/filter-post-type` block. Returns an empty array when no constraint
 * is configured so callers can spread the result unconditionally.
 *
 * Includes are wrapped in `bool.should` (OR within the include set), excludes
 * in `bool.must_not` (negate every excluded slug). Both wrappers are pushed
 * as separate `must` entries so the include and exclude semantics stay
 * orthogonal in ES — same shape used by instant-search's `excludedPostTypes`.
 *
 * Asymmetry: a single-slug include emits a bare `{ term: { post_type: T } }`
 * rather than wrapping it in `{ bool: { should: [...] } }`. Inside the outer
 * `bool.must` array those are semantically identical (a single-clause
 * `should` behaves like `must`), and the bare form keeps the URL shorter and
 * the test assertions readable. A single-slug exclude *always* wraps in
 * `bool.must_not` because ES has no bare-term equivalent for negation.
 *
 * @param {object|null} staticPostTypes - `{ include, exclude }` slug lists.
 * @return {Array<object>} ES filter clauses, possibly empty.
 */
export function buildStaticPostTypeClauses( staticPostTypes ) {
	if ( ! staticPostTypes ) {
		return [];
	}
	const clauses = [];
	const include = Array.isArray( staticPostTypes.include ) ? staticPostTypes.include : [];
	const exclude = Array.isArray( staticPostTypes.exclude ) ? staticPostTypes.exclude : [];

	if ( include.length > 0 ) {
		const should = include.map( slug => ( { term: { post_type: slug } } ) );
		clauses.push( should.length === 1 ? should[ 0 ] : { bool: { should } } );
	}
	if ( exclude.length > 0 ) {
		clauses.push( {
			bool: {
				must_not: exclude.map( slug => ( { term: { post_type: slug } } ) ),
			},
		} );
	}
	return clauses;
}

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object}      opts                   - Options.
 * @param {number}      opts.siteId            - Site ID.
 * @param {string}      opts.searchQuery       - Search query string.
 * @param {string}      opts.sortOrder         - 'relevance' | 'newest' | 'oldest', plus
 *                                             'rating_desc' | 'price_asc' | 'price_desc'
 *                                             on WooCommerce sites.
 * @param {string|null} opts.pageHandle        - Cursor for pagination.
 * @param {boolean}     opts.isPrivateSite     - Whether the site is private.
 * @param {boolean}     opts.isWpcom           - Whether the site runs on WordPress.com.
 * @param {string}      opts.apiRoot           - WordPress REST API root URL.
 * @param {object}      [opts.activeFilters]   - { [filterKey]: string[] } selected filters.
 * @param {object}      [opts.filterConfigs]   - { [filterKey]: FilterConfig } registered filters.
 * @param {string}      [opts.homeUrl]         - Home URL; required for private WPcom sites.
 * @param {object|null} [opts.priceRange]      - `{ min, max }` numeric range against the
 *                                             `wc.price` ES field. Either bound may be null
 *                                             for a half-open range. Read by future product
 *                                             filter blocks driven by `min_price` / `max_price`
 *                                             URL params.
 * @param {object|null} [opts.staticPostTypes] - `{ include, exclude }` post-type slug lists
 *                                             contributed by `jetpack-search/filter-post-type`. Folded
 *                                             into the ES filter clause as `bool.should` (include)
 *                                             and `bool.must_not` (exclude). Hidden from visitors —
 *                                             not represented in `activeFilters` and not surfaced
 *                                             in the active-filters pill list.
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
	staticPostTypes = null,
} ) {
	// `qss.encode()` runs `encodeURIComponent` on every value, so we pass the
	// raw query here. The instant-search code double-encodes (pre-encodes
	// before handing to qss), which works today only because the v1.3 API
	// silently tolerates it — queries with `&`, `+`, or non-ASCII characters
	// would otherwise search for the wrong string.
	const params = {
		query: searchQuery || '',
		sort: mapSortToApiValue( sortOrder ),
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
	const staticPostTypeClauses = buildStaticPostTypeClauses( staticPostTypes );
	if ( staticPostTypeClauses.length > 0 ) {
		filter = filter
			? { bool: { must: [ ...filter.bool.must, ...staticPostTypeClauses ] } }
			: { bool: { must: [ ...staticPostTypeClauses ] } };
	}
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
