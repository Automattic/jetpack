/**
 * External dependencies
 */
import 'url-polyfill';
import { decode, encode } from 'qss';

/**
 * Internal dependencies
 */
import {
	SERVER_OBJECT_NAME,
	SORT_DIRECTION_ASC,
	SORT_DIRECTION_DESC,
	RESULT_FORMAT_MINIMAL,
	RESULT_FORMAT_PRODUCT,
} from './constants';
import { getFilterKeys, getUnselectableFilterKeys, mapFilterToFilterKey } from './filters';
import { getSortOption } from './sort';

const knownResultFormats = [ RESULT_FORMAT_MINIMAL, RESULT_FORMAT_PRODUCT ];

function getQuery() {
	return decode( window.location.search.substring( 1 ) );
}

function pushQueryString( queryString, shouldEmitEvent = true ) {
	if ( history.pushState ) {
		const url = new window.URL( window.location.href );
		if ( window[ SERVER_OBJECT_NAME ] && 'homeUrl' in window[ SERVER_OBJECT_NAME ] ) {
			url.href = window[ SERVER_OBJECT_NAME ].homeUrl;
		}
		url.search = queryString;
		window.history.pushState( null, null, url.toString() );
		shouldEmitEvent && window.dispatchEvent( new Event( 'queryStringChange' ) );
	}
}

export function getSearchQuery() {
	const query = getQuery();
	// Cast query.s as string since it can be a number
	return 's' in query ? decodeURIComponent( String( query.s ) ) : '';
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

const DEFAULT_SORT_MAP = {
	'date|DESC': 'date_desc',
	'date|ASC': 'date_asc',
	'relevance|DESC': 'score_default',
};

// Convert a sort option like date|DESC to a sort key like date_desc
export function getSortKeyFromSortOption( sortOption ) {
	if ( ! Object.keys( DEFAULT_SORT_MAP ).includes( sortOption ) ) {
		return null;
	}

	return DEFAULT_SORT_MAP[ sortOption ];
}

// Convert a sort key like date_desc to a sort option like date|DESC
export function getSortOptionFromSortKey( sortKey ) {
	const sortKeyValues = Object.values( DEFAULT_SORT_MAP );

	if ( ! sortKeyValues.includes( sortKey ) ) {
		return null;
	}

	return Object.keys( DEFAULT_SORT_MAP )[ sortKeyValues.indexOf( sortKey ) ];
}

export function determineDefaultSort( initialSort, initialSearchString ) {
	const query = getQuery();
	if ( 'orderby' in query ) {
		return getSortQuery();
	}

	// NOTE: Force descending date sorting when no initial search string is provided
	if ( initialSearchString === '' ) {
		return 'date_desc';
	}

	const sortKeyFromSortOption = getSortKeyFromSortOption( initialSort );
	if ( sortKeyFromSortOption ) {
		return sortKeyFromSortOption;
	}

	return 'score_default';
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
	if ( ! ( filterKey in query ) || query[ filterKey ] === '' ) {
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

	return Object.assign(
		{},
		...getFilterKeys().map( key => ( {
			[ key ]: getFilterQueryByKey( key ),
		} ) )
	);
}

// These filter keys have been activated/selected outside of the overlay sidebar
export function getPreselectedFilterKeys( overlayWidgets ) {
	return getUnselectableFilterKeys( overlayWidgets ).filter(
		key => Array.isArray( getFilterQueryByKey( key ) ) && getFilterQueryByKey( key ).length > 0
	);
}

export function getPreselectedFilters( widgetsInOverlay, widgetsOutsideOverlay ) {
	const keys = getPreselectedFilterKeys( widgetsInOverlay );
	return widgetsOutsideOverlay
		.map( widget => widget.filters )
		.reduce( ( prev, current ) => prev.concat( current ), [] )
		.filter( filter => keys.includes( mapFilterToFilterKey( filter ) ) );
}

export function hasPreselectedFilters( widgetsInOverlay, widgetsOutsideOverlay ) {
	return getPreselectedFilters( widgetsInOverlay, widgetsOutsideOverlay ).length > 0;
}

export function hasFilter() {
	return getFilterKeys().some( key => getFilterQueryByKey( key ).length > 0 );
}

export function clearFiltersFromQuery() {
	const query = getQuery();
	getFilterKeys().forEach( key => delete query[ key ] );
	pushQueryString( encode( query ) );
}

export function setFilterQuery( filterKey, filterValue ) {
	const query = getQuery();
	query[ filterKey ] = filterValue;
	pushQueryString( encode( query ) );
}

export function getResultFormatQuery() {
	const query = getQuery();

	if ( knownResultFormats.includes( query.result_format ) ) {
		return query.result_format;
	}

	return RESULT_FORMAT_MINIMAL;
}

export function restorePreviousHref( initialHref, callback ) {
	if ( history.pushState ) {
		window.history.pushState( null, null, initialHref );

		const query = getQuery();
		const keys = [ ...getFilterKeys(), 's' ];
		// If initialHref has search or filter query values, clear them and reload.
		if ( Object.keys( query ).some( key => keys.includes( key ) ) ) {
			keys.forEach( key => delete query[ key ] );
			pushQueryString( encode( query ), false );
			window.location.reload( true );
			return;
		}

		// Otherwise, invoke the callback
		callback();
	}
}
