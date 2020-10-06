/**
 * External dependencies
 */
import fetch from 'unfetch';
import { encode } from 'qss';
import { flatten } from 'q-flat';
import stringify from 'fast-json-stable-stringify';
import Cache from 'cache';

/**
 * Internal dependencies
 */
import { getFilterKeys } from './filters';
import { MINUTE_IN_MILLISECONDS, SERVER_OBJECT_NAME } from './constants';

const isLengthyArray = array => Array.isArray( array ) && array.length > 0;
// Cache contents evicted after fixed time-to-live
const cache = new Cache( 5 * MINUTE_IN_MILLISECONDS );
const backupCache = new Cache( 30 * MINUTE_IN_MILLISECONDS );

export function buildFilterAggregations( widgets = [] ) {
	const aggregation = {};
	widgets.forEach( ( { filters: widgetFilters } ) =>
		widgetFilters.forEach( filter => {
			aggregation[ filter.filter_id ] = generateAggregation( filter );
		} )
	);
	return aggregation;
}

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
function generateDateRangeFilter( fieldName, input, type ) {
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
		startDate = `${ year }-${ month }-01`;
		endDate = `${ year }-${ +month + 1 }-01`;
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
function mapSortToApiValue( sort ) {
	return SORT_QUERY_MAP.get( sort, 'score_default' );
}

function generateApiQueryString( {
	aggregations,
	excludedPostTypes,
	filter,
	pageHandle,
	query,
	resultFormat,
	sort,
	postsPerPage = 10,
	adminQueryFilter,
} ) {
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

	switch ( resultFormat ) {
		case 'product':
			fields = fields.concat( [ 'wc.price' ] );
	}

	return encode(
		flatten( {
			aggregations,
			fields,
			highlight_fields: highlightFields,
			filter: buildFilterObject( filter, adminQueryFilter, excludedPostTypes ),
			query: encodeURIComponent( query ),
			sort: mapSortToApiValue( sort ),
			page_handle: pageHandle,
			size: postsPerPage,
		} )
	);
}

function promiseifedProxyRequest( proxyRequest, path, query ) {
	return new Promise( function ( resolve, reject ) {
		proxyRequest( { path, query, apiVersion: '1.3' }, function ( err, body, headers ) {
			if ( err ) {
				reject( err );
			}
			resolve( body, headers );
		} );
	} );
}

function errorHandlerFactory( cacheKey ) {
	return function errorHandler( error ) {
		// TODO: Display a message about falling back to a cached value in the interface
		// Fallback to either cache if we run into any errors
		const fallbackValue = cache.get( cacheKey ) || backupCache.get( cacheKey );
		if ( fallbackValue ) {
			return { _isCached: true, _isError: true, _isOffline: false, ...fallbackValue };
		}
		throw error;
	};
}

function responseHandlerFactory( cacheKey ) {
	return function responseHandler( responseJson ) {
		cache.put( cacheKey, responseJson );
		backupCache.put( cacheKey, responseJson );
		return responseJson;
	};
}

export function search( options ) {
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
	const responseHandler = responseHandlerFactory( key );

	const pathForPublicApi = `/sites/${ options.siteId }/search?${ queryString }`;

	const { apiNonce, apiRoot, isPrivateSite, isWpcom } = window[ SERVER_OBJECT_NAME ];
	if ( isPrivateSite && isWpcom ) {
		return import( '../external/wpcom-proxy-request' ).then( ( { default: proxyRequest } ) => {
			return promiseifedProxyRequest( proxyRequest, pathForPublicApi, options.query )
				.catch( errorHandler )
				.then( responseHandler );
		} );
	}

	// NOTE: Both atomic and Jetpack sites can be set to "private".
	const urlForPublicApi = `https://public-api.wordpress.com/rest/v1.3${ pathForPublicApi }`;
	const urlForPrivateApi = `${ apiRoot }wpcom/v2/search?${ queryString }`;
	const url = isPrivateSite ? urlForPrivateApi : urlForPublicApi;

	// NOTE: API Nonce is necessary to authenticate requests to class-wpcom-rest-api-v2-endpoint-search.php.
	return fetch( url, { headers: isPrivateSite ? { 'X-WP-Nonce': apiNonce } : {} } )
		.then( response => {
			if ( ! response.ok || response.status !== 200 ) {
				throw new Error( `Unexpected response from API with status code ${ response.status }.` );
			}
			return response;
		} )
		.catch( errorHandler )
		.then( r => r.json() )
		.then( responseHandler );
}
