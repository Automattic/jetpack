/**
 * External dependencies
 */
import { decode, encode } from 'qss';
// NOTE: We only import the get package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME, SORT_DIRECTION_ASC, SORT_DIRECTION_DESC } from './constants';
import { getSortOption } from './sort';

function getQuery() {
	return decode( window.location.search.substring( 1 ) );
}

function pushQueryString( queryString ) {
	// NOTE: This erases location.pathname
	if ( history.pushState ) {
		const newurl = queryString
			? `${ window.location.protocol }//${ window.location.host }?${ queryString }`
			: `${ window.location.protocol }//${ window.location.host }${ window.location.pathname }`;
		window.history.pushState( { path: newurl }, '', newurl );
	}
}

export function restorePreviousPath( pathname ) {
	if ( history.pushState ) {
		const newurl = `${ window.location.protocol }//${ window.location.host }${ pathname }`;
		window.history.pushState( { path: newurl }, '', newurl );
	}
}

export function getSearchQuery() {
	const query = getQuery();
	return 's' in query ? decodeURIComponent( query.s.replace( /\+/g, '%20' ) ) : '';
}

export function setSearchQuery( searchValue ) {
	const query = getQuery();
	if ( searchValue === '' ) {
		delete query.s;
	} else {
		query.s = searchValue;
	}
	pushQueryString( encode( query ) );
}

export function determineDefaultSort( widgetOptions ) {
	const query = getQuery();
	if ( 'orderby' in query ) {
		return getSortQuery();
	}

	switch ( widgetOptions ) {
		case 'date|DESC':
			return 'date_desc';
		case 'date|ASC':
			return 'date_asc';
		case 'relevance|DESC':
		default:
			return 'score_default';
	}
}

const ORDERED_SORT_TYPES = [ 'date', 'price', 'rating' ];
const SORT_QUERY_MAP = {
	date: {
		[ SORT_DIRECTION_ASC ]: 'date_asc',
		[ SORT_DIRECTION_DESC ]: 'date_desc',
	},
	price: {
		[ SORT_DIRECTION_ASC ]: 'price_asc',
		[ SORT_DIRECTION_DESC ]: 'price_desc',
	},
	rating: {
		[ SORT_DIRECTION_ASC ]: 'rating_asc',
		[ SORT_DIRECTION_DESC ]: 'rating_desc',
	},
	recency: 'score_recency',
	keyword: 'score_keyword',
	popularity: 'score_popularity',
};

export function getSortQuery() {
	const query = getQuery();
	const order = 'order' in query ? query.order : 'DESC';
	const orderby = 'orderby' in query ? query.orderby : 'relevance';
	let sort = 'score_default';
	if ( ORDERED_SORT_TYPES.includes( orderby ) ) {
		sort = SORT_QUERY_MAP[ orderby ][ order ];
	} else if ( Object.keys( SORT_QUERY_MAP ).includes( orderby ) ) {
		sort = SORT_QUERY_MAP[ orderby ];
	}
	return sort;
}

export function setSortQuery( sortKey ) {
	const query = getQuery();
	const sortOption = getSortOption( sortKey );

	if ( ! sortOption ) {
		return false;
	}

	query.orderby = sortOption.field;
	query.order = sortOption.direction;
	pushQueryString( encode( query ) );
}

function getFilterQueryByKey( filterKey ) {
	const query = getQuery();
	if ( ! ( filterKey in query ) ) {
		return [];
	}
	if ( typeof query[ filterKey ] === 'string' ) {
		return [ query[ filterKey ] ];
	}
	return query[ filterKey ];
}

export function getFilterKeys() {
	const keys = [
		// Post types
		'post_types',
		// Date filters
		'month_post_date',
		'month_post_date_gmt',
		'month_post_modified',
		'month_post_modified_gmt',
		'year_post_date',
		'year_post_date_gmt',
		'year_post_modified',
		'year_post_modified_gmt',
	];

	// Extract taxonomy names from server widget data
	const widgetFilters = get( window[ SERVER_OBJECT_NAME ], 'widgets[0].filters' );
	if ( widgetFilters ) {
		return [
			...keys,
			...widgetFilters
				.filter( filter => filter.type === 'taxonomy' )
				.map( filter => filter.taxonomy ),
		];
	}
	return [ ...keys, 'category', 'post_tag' ];
}

export function getFilterQuery( filterKey ) {
	if ( filterKey ) {
		return getFilterQueryByKey( filterKey );
	}

	return Object.assign(
		{},
		...getFilterKeys().map( key => ( {
			[ key ]: getFilterQueryByKey( key ),
		} ) )
	);
}

export function hasFilter() {
	const filter_keys = getFilterKeys();
	for ( let i = 0; i < filter_keys.length; i++ ) {
		if ( getFilterQueryByKey( filter_keys[ i ] ).length > 0 ) {
			return true;
		}
	}
	return false;
}

export function setFilterQuery( filterKey, filterValue ) {
	const query = getQuery();
	query[ filterKey ] = filterValue;
	pushQueryString( encode( query ) );
}
