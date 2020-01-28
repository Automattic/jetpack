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
import { getFilterKeys } from './query-string';
import { MINUTE_IN_MILLISECONDS } from './constants';

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

function buildFilterObject( filterQuery ) {
	if ( ! filterQuery ) {
		return {};
	}

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
	return filter;
}

export function search( {
	aggregations,
	filter,
	pageHandle,
	query,
	resultFormat,
	siteId,
	sort,
	postsPerPage = 10,
} ) {
	const key = stringify( Array.from( arguments ) );

	// Use cached value from the last 30 minutes if browser is offline
	if ( ! navigator.onLine && backupCache.get( key ) ) {
		return backupCache
			.get( key )
			.then( data => ( { _isCached: true, _isError: false, _isOffline: true, ...data } ) );
	}
	// Use cached value from the last 5 minutes
	if ( cache.get( key ) ) {
		return cache
			.get( key )
			.then( data => ( { _isCached: true, _isError: false, _isOffline: false, ...data } ) );
	}

	let fields = [
		'date',
		'permalink.url.raw',
		'tag.name.default',
		'category.name.default',
		'post_type',
		'has.image',
		'shortcode_types',
	];
	const highlightFields = [ 'title', 'content', 'comments' ];

	switch ( resultFormat ) {
		case 'engagement':
		case 'product':
			fields = fields.concat( [ 'image.url.raw', 'wc.price' ] );
	}

	const queryString = encode(
		flatten( {
			aggregations,
			fields,
			highlight_fields: highlightFields,
			filter: buildFilterObject( filter ),
			query: encodeURIComponent( query ),
			sort,
			page_handle: pageHandle,
			size: postsPerPage,
		} )
	);

	return fetch(
		`https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?${ queryString }`
	)
		.catch( error => {
			// TODO: Display a message about falling back to a cached value in the interface
			// Fallback to either cache if we run into any errors
			const fallbackValue = cache.get( key ) || backupCache.get( key );
			if ( fallbackValue ) {
				return { _isCached: true, _isError: true, _isOffline: false, ...fallbackValue };
			}
			throw error;
		} )
		.then( response => {
			const json = response.json();
			cache.put( key, json );
			backupCache.put( key, json );
			return json;
		} );
}
