/**
 * External dependencies
 */
import { decode, encode } from 'qss';

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

export function getSearchSort() {
	const query = getQuery();
	const order = 'order' in query ? query.order : 'DESC';
	const orderby = 'orderby' in query ? query.orderby : 'relevance';
	let sort;
	switch ( orderby ) {
		case 'date':
			if ( order === 'ASC' ) {
				sort = 'date_asc';
			} else {
				sort = 'date_desc';
			}
			break;
		case 'price':
			if ( order === 'ASC' ) {
				sort = 'price_asc';
			} else {
				sort = 'price_desc';
			}
			break;
		case 'rating':
			if ( order === 'ASC' ) {
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

export function getFilterQuery( filterKey ) {
	if ( filterKey ) {
		return getFilterQueryByKey( filterKey );
	}

	return {
		// Taxonomies
		category: getFilterQueryByKey( 'category' ),
		post_tag: getFilterQueryByKey( 'post_tag' ),
		// Post types
		post_types: getFilterQueryByKey( 'post_types' ),
		// Date filters
		day: getFilterQueryByKey( 'day' ),
		monthnum: getFilterQueryByKey( 'monthnum' ),
		year: getFilterQueryByKey( 'year' ),
	};
}

export function setFilterQuery( filterKey, filterValue ) {
	const query = getQuery();
	query[ filterKey ] = filterValue;
	pushQueryString( encode( query ) );
}
