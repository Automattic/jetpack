/**
 * External dependencies
 */
import { encode } from 'qss';
import { flatten } from 'q-flat';
import stringify from 'fast-json-stable-stringify';
import lru from 'tiny-lru/lib/tiny-lru.esm';

/**
 * Internal dependencies
 */
import { getFilterKeys } from './filters';
import {
	MINUTE_IN_MILLISECONDS,
	MULTISITE_NO_GROUP_VALUE,
	RESULT_FORMAT_PRODUCT,
	SERVER_OBJECT_NAME,
} from './constants';

let abortController;

const isLengthyArray = array => Array.isArray( array ) && array.length > 0;
// Cache contents evicted after fixed time-to-live
const cache = lru( 30, 5 * MINUTE_IN_MILLISECONDS );
const backupCache = lru( 30, 30 * MINUTE_IN_MILLISECONDS );

// Set up initial abort controller
resetAbortController();

/**
 * Builds ElasticSerach aggregations for filters defined by search widgets.
 *
 * @param {object[]} widgets - an array of widget configuration objects
 * @returns {object} filter aggregations
 */
export function buildFilterAggregations( widgets = [] ) {
	const aggregation = {};
	widgets.forEach( ( { filters: widgetFilters } ) =>
		widgetFilters.forEach( filter => {
			aggregation[ filter.filter_id ] = generateAggregation( filter );
		} )
	);
	return aggregation;
}

/**
 * The function set the aggregation count to zero which is just meant for users to uncheck.
 * Tried to merge the buckets, but which ended up showing too many filters.
 *
 * @param {object} newAggregations - New aggregations to operate on.
 * @returns {object} - Aggregations with doc_count set to 0.
 */
export function setDocumentCountsToZero( newAggregations ) {
	newAggregations = newAggregations ?? {};
	return Object.fromEntries(
		Object.entries( newAggregations )
			.filter( ( [ , aggregation ] ) => aggregation?.buckets?.length > 0 )
			.map( ( [ aggregationKey, aggregation ] ) => {
				const buckets = aggregation.buckets.map( bucket => ( {
					...bucket,
					doc_count: 0,
				} ) );
				return [ aggregationKey, { ...aggregation, buckets } ];
			} )
	);
}

/**
 * Builds ElasticSearch aggregations for a given filter.
 *
 * @param {object[]} filter - a filter object from a widget configuration object.
 * @returns {object} filter aggregations
 */
function generateAggregation( filter ) {
	switch ( filter.type ) {
		case 'date_histogram': {
			const field = filter.field === 'post_date_gmt' ? 'date_gmt' : 'date';
			return {
				date_histogram: { field, interval: filter.interval },
			};
		}
		case 'taxonomy': {
			let field = `taxonomy.${ filter.taxonomy }.slug_slash_name`;
			if ( filter.taxonomy === 'post_tag' ) {
				field = 'tag.slug_slash_name';
			} else if ( filter.taxonomy === 'category' ) {
				field = 'category.slug_slash_name';
			}

			return { terms: { field, size: filter.count } };
		}
		case 'post_type': {
			return { terms: { field: filter.type, size: filter.count } };
		}
	}
}

const DATE_REGEX = /(\d{4})-(\d{2})-(\d{2})/;
/**
 * Generates a ElasticSerach date range filter.
 *
 * @param {string} fieldName - Name of the field (created, modified, etc).
 * @param {string} input - Filter value.
 * @param {string} type - Date range type (year vs month).
 * @returns {object} date filter.
 */
export function generateDateRangeFilter( fieldName, input, type ) {
	let year, month;
	if ( type === 'year' ) {
		[ , year, , ] = input.match( DATE_REGEX );
	}

	if ( type === 'month' ) {
		[ , year, month ] = input.match( DATE_REGEX );
	}
	let startDate = '';
	let endDate = '';
	if ( month ) {
		const nextMonth = +month + 1;
		const nextMonthPadded = nextMonth < 10 ? `0${ nextMonth }` : `${ nextMonth }`;
		startDate = `${ year }-${ month }-01`;
		endDate = nextMonth <= 12 ? `${ year }-${ nextMonthPadded }-01` : `${ +year + 1 }-01-01`;
	} else if ( year ) {
		startDate = `${ year }-01-01`;
		endDate = `${ +year + 1 }-01-01`;
	}

	return { range: { [ fieldName ]: { gte: startDate, lt: endDate } } };
}

const filterKeyToEsFilter = new Map( [
	// Post type
	[ 'post_types', postType => ( { term: { post_type: postType } } ) ],

	// Built-in taxonomies
	[ 'category', category => ( { term: { 'category.slug': category } } ) ],
	[ 'post_tag', tag => ( { term: { 'tag.slug': tag } } ) ],

	// Dates
	[ 'month_post_date', datestring => generateDateRangeFilter( 'date', datestring, 'month' ) ],
	[
		'month_post_date_gmt',
		datestring => generateDateRangeFilter( 'date_gmt', datestring, 'month' ),
	],
	[ 'month_post_modified', datestring => generateDateRangeFilter( 'date', datestring, 'month' ) ],
	[
		'month_post_modified_gmt',
		datestring => generateDateRangeFilter( 'date_gmt', datestring, 'month' ),
	],
	[ 'year_post_date', datestring => generateDateRangeFilter( 'date', datestring, 'year' ) ],
	[ 'year_post_date_gmt', datestring => generateDateRangeFilter( 'date_gmt', datestring, 'year' ) ],
	[ 'year_post_modified', datestring => generateDateRangeFilter( 'date', datestring, 'year' ) ],
	[
		'year_post_modified_gmt',
		datestring => generateDateRangeFilter( 'date_gmt', datestring, 'year' ),
	],
] );

/**
 * Build static filters object
 *
 * @param {object} staticFilters - list of static filter key-value.
 * @returns {object} - list of selected static filters.
 */
function buildStaticFilters( staticFilters ) {
	const selectedFilters = {};
	Object.keys( staticFilters ).forEach( key => {
		const value = staticFilters[ key ];
		if ( key === 'group_id' ) {
			if ( value !== MULTISITE_NO_GROUP_VALUE ) {
				// Do not set filter if for no_groups, it should just use current blog.
				selectedFilters[ key ] = value;
			}
		}
	} );
	return selectedFilters;
}

/**
 * Build an ElasticSerach filter object.
 *
 * @param {object} filterQuery - Filter query value object.
 * @param {object} adminQueryFilter - Manual ElasticSearch query override.
 * @param {string} excludedPostTypes - Post types excluded via the Customizer.
 * @returns {object} ElasticSearch filter object.
 */
function buildFilterObject( filterQuery, adminQueryFilter, excludedPostTypes ) {
	const filter = { bool: { must: [] } };
	getFilterKeys()
		.filter( key => isLengthyArray( filterQuery[ key ] ) )
		.forEach( key => {
			filterQuery[ key ].forEach( item => {
				if ( filterKeyToEsFilter.has( key ) ) {
					filter.bool.must.push( filterKeyToEsFilter.get( key )( item ) );
				} else {
					// If key is not in the standard map, assume to be a custom taxonomy
					filter.bool.must.push( { term: { [ `taxonomy.${ key }.slug` ]: item } } );
				}
			} );
		} );

	if ( adminQueryFilter ) {
		filter.bool.must.push( adminQueryFilter );
	}

	if ( excludedPostTypes?.length > 0 ) {
		filter.bool.must.push( {
			bool: {
				must_not: excludedPostTypes.map( postType =>
					filterKeyToEsFilter.get( 'post_types' )( postType )
				),
			},
		} );
	}
	return filter;
}

// Maps sort values to values expected by the API
const SORT_QUERY_MAP = new Map( [
	[ 'oldest', 'date_asc' ],
	[ 'newest', 'date_desc' ],
	[ 'relevance', 'score_default' ],
] );
/**
 * Map sort values to ones compatible with the API.
 *
 * @param {string} sort - Sort value.
 * @returns {string} Mapped sort value.
 */
function mapSortToApiValue( sort ) {
	// Some sorts don't need to be mapped
	if ( [ 'price_asc', 'price_desc', 'rating_desc' ].includes( sort ) ) {
		return sort;
	}

	return SORT_QUERY_MAP.get( sort, 'score_default' );
}

/* eslint-disable jsdoc/require-param,jsdoc/check-param-names */
/**
 * Generate the query string for an API request
 *
 * @param {object} options - Options object for the function
 * @returns {string} The generated query string.
 */
function generateApiQueryString( {
	aggregations,
	excludedPostTypes,
	filter,
	staticFilters,
	pageHandle,
	query,
	resultFormat,
	sort,
	postsPerPage = 10,
	adminQueryFilter,
	isInCustomizer = false,
} ) {
	if ( query === null ) {
		query = '';
	}

	let fields = [
		'date',
		'permalink.url.raw',
		'tag.name.default',
		'category.name.default',
		'post_type',
		'has.image',
		'shortcode_types',
		'image.url.raw',
	];
	const highlightFields = [ 'title', 'content', 'comments' ];

	/* Fetch additional fields for product results
	 *
	 * We always need these in the Customizer too, because the API request is not
	 * repeated when switching result format
	 */
	if ( resultFormat === RESULT_FORMAT_PRODUCT || isInCustomizer ) {
		fields = fields.concat( [
			'meta._wc_average_rating.double',
			'meta._wc_review_count.long',
			'wc.formatted_price',
			'wc.formatted_regular_price',
			'wc.formatted_sale_price',
			'wc.price',
			'wc.sale_price',
		] );
	}

	/**
	 * Fetch additional fields for multi site results
	 */
	if (
		staticFilters &&
		staticFilters.group_id &&
		staticFilters.group_id !== MULTISITE_NO_GROUP_VALUE
	) {
		fields = fields.concat( [ 'author', 'blog_name', 'blog_icon_url' ] );
	}

	let params = {
		aggregations,
		fields,
		highlight_fields: highlightFields,
		filter: buildFilterObject( filter, adminQueryFilter, excludedPostTypes ),
		query: encodeURIComponent( query ),
		sort: mapSortToApiValue( sort ),
		page_handle: pageHandle,
		size: postsPerPage,
	};

	if ( staticFilters && Object.keys( staticFilters ).length > 0 ) {
		params = {
			...params,
			...buildStaticFilters( staticFilters ),
		};
	}

	return encode( flatten( params ) );
}
/* eslint-enable jsdoc/require-param,jsdoc/check-param-names */

/**
 * Generate an error handler for a given cache key
 *
 * @param {string} cacheKey - The cache key to use
 * @returns {Function} An error handler to be used with a search request
 */
function errorHandlerFactory( cacheKey ) {
	return function errorHandler( error ) {
		// TODO: Display a message about falling back to a cached value in the interface.
		const fallbackValue = cache.get( cacheKey ) || backupCache.get( cacheKey );

		// Fallback to cached value if request has been cancelled.
		if ( error.name === 'AbortError' ) {
			return fallbackValue
				? { _isCached: true, _isError: false, _isOffline: false, ...fallbackValue }
				: null;
		}
		// Fallback to cached value if we run into any errors.
		if ( fallbackValue ) {
			return { _isCached: true, _isError: true, _isOffline: false, ...fallbackValue };
		}

		// Otherwise, propagate the error.
		throw error;
	};
}

/**
 * Generate a response handler for a given cache key
 *
 * @param {string} cacheKey - The cache key to use
 * @param {number} requestId - Sequential ID used to determine recency of requests.
 * @returns {Function} A response handler to be used with a search request
 */
function responseHandlerFactory( cacheKey, requestId ) {
	return function responseHandler( responseJson ) {
		const response = { ...responseJson, requestId };
		cache.set( cacheKey, response );
		backupCache.set( cacheKey, response );
		return response;
	};
}

/**
 * Abort the existing request and set up a new abort controller, for new requests.
 */
function resetAbortController() {
	if ( abortController ) {
		abortController.abort();
	}
	abortController = new AbortController();
}

/**
 * Perform a search.
 *
 * @param {object} options - Search options
 * @param {number} requestId - Sequential ID used to determine recency of requests.
 * @returns {Promise} A promise to the JSON response object
 */
export function search( options, requestId ) {
	const key = stringify( Array.from( arguments ) );

	// Use cached value from the last 30 minutes if browser is offline
	if ( ! navigator.onLine && backupCache.get( key ) ) {
		return Promise.resolve( backupCache.get( key ) ).then( data => ( {
			_isCached: true,
			_isError: false,
			_isOffline: true,
			...data,
		} ) );
	}
	// Use cached value from the last 5 minutes
	if ( cache.get( key ) ) {
		return Promise.resolve( cache.get( key ) ).then( data => ( {
			_isCached: true,
			_isError: false,
			_isOffline: false,
			...data,
		} ) );
	}

	const queryString = generateApiQueryString( options );
	const errorHandler = errorHandlerFactory( key );
	const responseHandler = responseHandlerFactory( key, requestId );

	const pathForPublicApi = `/sites/${ options.siteId }/search?${ queryString }`;

	const { apiNonce, apiRoot, homeUrl, isPrivateSite, isWpcom } = window[ SERVER_OBJECT_NAME ];

	// NOTE: Both simple and atomic sites can be set to "private".
	//       "Private" Jetpack sites are not yet supported.
	const urlForPublicApi = `https://public-api.wordpress.com/rest/v1.3${ pathForPublicApi }`;
	const urlForWpcomOrigin = `${ homeUrl }/wp-json/wpcom-origin/v1.3${ pathForPublicApi }`;
	const urlForAtomicOrigin = `${ apiRoot }wpcom/v2/search?${ queryString }`;
	let url = urlForPublicApi;
	if ( isPrivateSite && isWpcom ) {
		url = urlForWpcomOrigin;
	} else if ( isPrivateSite ) {
		url = urlForAtomicOrigin;
	}

	resetAbortController();

	// NOTE: API Nonce is necessary to authenticate requests to class-wpcom-rest-api-v2-endpoint-search.php.
	return fetch( url, {
		headers: isPrivateSite ? { 'X-WP-Nonce': apiNonce } : {},
		credentials: isPrivateSite ? 'include' : 'same-origin',
		signal: abortController.signal,
	} )
		.then( response => {
			if ( response.status !== 200 ) {
				return Promise.reject(
					`Unexpected response from API with status code ${ response.status }.`
				);
			}
			return response;
		} )
		.then( r => r.json() )
		.then( responseHandler )
		.catch( errorHandler );
}
