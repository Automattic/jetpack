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
import { SERVER_OBJECT_NAME, SORT_DIRECTION_ASC } from './constants';
import { getSortOption } from './sort';

function getQuery() {
	return decode( window.location.search.substring( 1 ) );
}

function pushQueryString( queryString ) {
	if ( history.pushState ) {
		const newurl = `${ window.location.protocol }//${ window.location.host }${
			window.location.pathname
		}?${ queryString }`;
		window.history.pushState( { path: newurl }, '', newurl );
	}
}

export function getSearchQuery() {
	const query = getQuery();
	return 's' in query ? decodeURIComponent( query.s.replace( /\+/g, '%20' ) ) : '';
}

export function setSearchQuery( searchValue ) {
	const query = getQuery();
	query.s = searchValue;
	pushQueryString( encode( query ) );
}

export function getSortQuery() {
	const query = getQuery();
	const order = 'order' in query ? query.order : 'DESC';
	const orderby = 'orderby' in query ? query.orderby : 'relevance';
	let sort;
	switch ( orderby ) {
		case 'date':
			if ( order === SORT_DIRECTION_ASC ) {
				sort = 'date_asc';
			} else {
				sort = 'date_desc';
			}
			break;
		case 'price':
			if ( order === SORT_DIRECTION_ASC ) {
				sort = 'price_asc';
			} else {
				sort = 'price_desc';
			}
			break;
		case 'rating':
			if ( order === SORT_DIRECTION_ASC ) {
				sort = 'rating_asc';
			} else {
				sort = 'rating_desc';
			}
			break;
		case 'recency':
			sort = 'score_recency';
			break;
		case 'keyword':
			sort = 'score_keyword';
			break;
		case 'popularity':
			sort = 'score_popularity';
			break;
		case 'relevance':
		case 'score_default':
		default:
			sort = 'score_default';
			break;
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

export function setFilterQuery( filterKey, filterValue ) {
	const query = getQuery();
	query[ filterKey ] = filterValue;
	pushQueryString( encode( query ) );
}
