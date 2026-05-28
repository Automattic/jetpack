import { flatten } from 'q-flat';
import { encode } from 'qss';

/**
 * Fields to request from the v1.3 search API. Without an explicit `fields[]`
 * the API returns only `date`/`post_id`. Alt text is deliberately omitted —
 * the result card's `<img>` is decorative (`alt=""`). WC fields are always
 * requested; the store fetches once per page and any block can render the
 * product layout.
 */
export const SEARCH_FIELDS = [
	'author',
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
 * Sort UI key → v1.3 API `sort` value. Mirrors instant-search's
 * `mapSortToApiValue`. Only keys that differ are listed; product-format keys
 * pass through verbatim.
 */
const SORT_QUERY_MAP = {
	newest: 'date_desc',
	oldest: 'date_asc',
	relevance: 'score_default',
};

const SORT_PASSTHROUGH = new Set( [ 'rating_desc', 'price_asc', 'price_desc' ] );

/**
 * Translate store `sortOrder` to API `sort`.
 *
 * @param {string} sortOrder - UI-side sort key.
 * @return {string} API value.
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
 * Resolve ES field names and bucket format for a filterConfig.
 *
 * Mirrors `src/instant-search/lib/api.js` so deep links round-trip between
 * the overlay and Search 3.0. Aggregations use `slug_slash_name` so each
 * bucket carries both slug and label — no extra WP lookup.
 *
 * `bucketFormat`: `slash` splits on first `/`, `plain` uses key for both,
 * `date` uses `key_as_string` + `formatDateBucketLabel`.
 *
 * Custom taxonomies routed through a reserved slot arrive with
 * `effectiveSlug` pre-resolved server-side (`Filter_Checkbox::build_config()`),
 * keeping this function pure. See `aggregationKeyFor` for the request-key swap.
 *
 * @param {object} config - FilterConfig entry.
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
			// `effectiveSlug` pre-resolved server-side; falls back to
			// `taxonomy` for older saved blocks that pre-date the field.
			const effectiveSlug = config.effectiveSlug || taxonomy;
			return {
				aggField: `taxonomy.${ effectiveSlug }.slug_slash_name`,
				filterField: `taxonomy.${ effectiveSlug }.slug`,
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
			// WC `product_visibility` taxonomy: presence of `outofstock` term
			// means out-of-stock. Two-state only — backorder lives in
			// `_stock_status` postmeta that the indexer drops. `buildAggregations`
			// / `buildFilterClause` special-case the include + must_not.
			return {
				aggField: 'taxonomy.product_visibility.slug',
				filterField: 'taxonomy.product_visibility.slug',
				bucketFormat: 'plain',
			};
		case 'wc_rating':
			// Reads `_wc_average_rating` meta via histogram (range aggs aren't
			// whitelisted on v1.3). `interval=1, offset=0.5` puts buckets on
			// half-integers, mirroring WC's `ROUND(avg_rating, 0)`.
			return {
				aggField: 'meta._wc_average_rating.double',
				filterField: 'meta._wc_average_rating.double',
				bucketFormat: 'plain',
			};
		case 'date':
			// v1.3 whitelists `date` only for date_histogram + range.
			return { aggField: 'date', filterField: 'date', bucketFormat: 'date' };
	}
	return { aggField: null, filterField: null, bucketFormat: 'plain' };
}

/**
 * Lower bounds for the rating filter. `?rating_filter[]=N` matches
 * `avg ≥ N − 0.5` — half-integers mirror WC's `ROUND(avg_rating, 0)` so
 * "4★ & up" is a true superset of higher-star rows. Single-bound by design
 * (Amazon/Etsy/Wayfair convention). Avg < 0.5 has no star entry — matches WC's UI.
 */
export const WC_RATING_RANGES = [
	{ key: '1', from: 0.5 },
	{ key: '2', from: 1.5 },
	{ key: '3', from: 2.5 },
	{ key: '4', from: 3.5 },
	{ key: '5', from: 4.5 },
];

/**
 * Aggregation request key. Mapped custom taxonomies aggregate under their
 * slot slug — the WPCOM proxy validates agg names against indexable
 * taxonomies (a non-indexed user slug silently returns nothing).
 * `remapAggregationsToFilterKeys` in `store/index.js` reverses this for downstream consumers.
 *
 * @param {string} filterKey - User-facing filter key.
 * @param {object} config    - FilterConfig entry.
 * @return {string} Agg request key.
 */
export function aggregationKeyFor( filterKey, config ) {
	const slug = config?.effectiveSlug;
	if ( slug && config?.taxonomy && slug !== config.taxonomy ) {
		return slug;
	}
	return filterKey;
}

/**
 * Build ES aggregation requests from registered filterConfigs.
 *
 * `terms` ordering by `alpha` is a hint only — `checkboxFilterItems` resorts
 * by visible label so slug and label can diverge (`food-news` → "Restaurant Reviews").
 * `date_histogram` `format` makes `key_as_string` match the URL slug; no
 * `size`, client slices to `maxItems`.
 *
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } map.
 * @return {object} Aggregations payload.
 */
export function buildAggregations( filterConfigs ) {
	const aggregations = {};
	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		const aggKey = aggregationKeyFor( filterKey, config );
		// Histogram instead of `range` (not whitelisted on v1.3).
		if ( config?.filterType === 'wc_rating' ) {
			const { aggField: ratingField } = resolveFilterFields( config );
			aggregations[ aggKey ] = {
				histogram: {
					field: ratingField,
					interval: 1,
					offset: 0.5,
					min_doc_count: 0,
				},
			};
			continue;
		}

		// Probe only `outofstock` (in-stock = `total - outofstock`); `include`
		// keeps `featured` / `rated-N` / etc. out of the response.
		if ( config?.filterType === 'wc_stock_status' ) {
			const { aggField: stockField } = resolveFilterFields( config );
			aggregations[ aggKey ] = {
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
			aggregations[ aggKey ] = {
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
		aggregations[ aggKey ] = {
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
 * Default: OR within a key (`bool.should`), AND across keys (`bool.must`).
 * Diverges from the legacy overlay's all-AND — Search 3.0 follows
 * modern faceted-search broaden-on-click UX.
 *
 * Taxonomy filters can opt into AND via `config.queryType === 'and'` (the
 * filter-checkbox Logic inspector). See `Filter_Checkbox::normalize_query_type()`.
 *
 * @param {object} activeFilters - { [filterKey]: string[] } selections.
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } map.
 * @return {object|undefined} `{ bool: { must: [...] } }` or undefined.
 */
export function buildFilterClause( activeFilters, filterConfigs ) {
	const must = [];
	for ( const [ filterKey, values ] of Object.entries( activeFilters ?? {} ) ) {
		if ( ! Array.isArray( values ) || values.length === 0 ) {
			continue;
		}
		const config = filterConfigs?.[ filterKey ];

		// Two-state: `outofstock` narrows; `instock` is `must_not outofstock`.
		// Both selected = no constraint (term + must_not would zero results).
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

		// Each star → `≥ N − 0.5` range. Block is single-select; multi-value
		// URLs OR to the lowest threshold (harmless for stale deep links).
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
		// AND applies to taxonomy filters only (see header). Single-clause
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

/**
 * `term` clauses for single-select static filters (`filter-static`). The
 * `filter_id` is used directly as the ES field name. Mirrors the legacy
 * overlay at `src/instant-search/store/effects.js`.
 *
 * @param {object} selections    - { [filterKey]: string } single-select values.
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } map.
 * @return {Array<object>} `must` clauses; empty when nothing selected.
 */
export function buildStaticFilterClauses( selections, filterConfigs ) {
	const clauses = [];
	for ( const [ filterKey, value ] of Object.entries( selections ?? {} ) ) {
		if ( ! value || filterConfigs?.[ filterKey ]?.kind !== 'static' ) {
			continue;
		}
		clauses.push( { term: { [ filterKey ]: value } } );
	}
	return clauses;
}

// Memoized — `filterItems` re-runs on every state read.
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
 * `bool.must` clauses for the page-level post-type scope set on the
 * `search-results` block. Includes → `bool.should`, excludes →
 * `bool.must_not`. Single-slug include emits a bare `term` (shorter URL);
 * excludes always wrap because ES has no bare-term negation.
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
 * Build the full search API URL. Mirrors the 3-path routing in
 * `src/instant-search/lib/api.js`.
 *
 * @param {object}      opts                          - Options.
 * @param {number}      opts.siteId                   - Site ID.
 * @param {string}      opts.searchQuery              - Query string.
 * @param {string}      opts.sortOrder                - Sort key (Woo adds rating_desc/price_*).
 * @param {string|null} opts.pageHandle               - Pagination cursor.
 * @param {boolean}     opts.isPrivateSite            - Private site flag.
 * @param {boolean}     opts.isWpcom                  - WPCOM flag.
 * @param {string}      opts.apiRoot                  - WP REST API root.
 * @param {object}      [opts.activeFilters]          - { [filterKey]: string[] }.
 * @param {object}      [opts.filterConfigs]          - { [filterKey]: FilterConfig }.
 * @param {string}      [opts.homeUrl]                - Required for private WPcom sites.
 * @param {object|null} [opts.priceRange]             - `{ min, max }` against `wc.price`.
 * @param {object|null} [opts.staticPostTypes]        - `{include, exclude}` page-level scope from search-results.
 * @param {object}      [opts.staticFilterSelections] - { [filterKey]: string } static-filter values.
 * @return {string} Full URL.
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
	staticFilterSelections = {},
} ) {
	// `qss.encode()` encodes every value, so we pass the raw query. The
	// overlay double-encodes; v1.3 tolerates it today but breaks on `&`/`+`/non-ASCII.
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

	// `buildFilterClause` returns `{ bool: { must: [...] } }` or `undefined`.
	let filter = buildFilterClause( activeFilters, filterConfigs );
	const staticPostTypeClauses = buildStaticPostTypeClauses( staticPostTypes );
	if ( staticPostTypeClauses.length > 0 ) {
		filter = filter
			? { bool: { must: [ ...filter.bool.must, ...staticPostTypeClauses ] } }
			: { bool: { must: [ ...staticPostTypeClauses ] } };
	}
	const staticFilterClauses = buildStaticFilterClauses( staticFilterSelections, filterConfigs );
	if ( staticFilterClauses.length > 0 ) {
		filter = filter
			? { bool: { must: [ ...filter.bool.must, ...staticFilterClauses ] } }
			: { bool: { must: [ ...staticFilterClauses ] } };
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
		// Build a fresh wrapper — keeps the shape correct if `buildFilterClause`
		// ever memoizes its return.
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
