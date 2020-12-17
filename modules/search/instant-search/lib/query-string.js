/**
 * External dependencies
 */
import 'url-polyfill';
import { encode } from 'qss';

/**
 * Internal dependencies
 */
import {
	SERVER_OBJECT_NAME,
	SORT_DIRECTION_ASC,
	VALID_RESULT_FORMAT_KEYS,
	VALID_SORT_KEYS,
} from './constants';
import { getFilterKeys, getUnselectableFilterKeys, mapFilterToFilterKey } from './filters';
import { decode } from '../external/query-string-decode';

function getQuery() {
	return decode( window.location.search.substring( 1 ), false, false );
}

function pushQueryString( queryString, shouldEmitEvent = true ) {
	if ( history.pushState ) {
		const url = new window.URL( window.location.href );
		if ( window[ SERVER_OBJECT_NAME ] && 'homeUrl' in window[ SERVER_OBJECT_NAME ] ) {
			url.href = window[ SERVER_OBJECT_NAME ].homeUrl;
		}
		url.search = queryString;
		window.history.pushState( null, null, url.toString() );
		shouldEmitEvent && window.dispatchEvent( new CustomEvent( 'queryStringChange' ) );
	}
}

export function getSearchQuery() {
	const query = getQuery();
	// Cast query.s as string since it can be a number
	return 's' in query ? String( query.s ) : '';
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

export function determineDefaultSort( initialSort ) {
	const sortFromQuery = getSortQuery();
	if ( sortFromQuery ) {
		return sortFromQuery;
	}

	const sortFromLegacyValues = getSortFromOrderBy();
	if ( sortFromLegacyValues ) {
		return sortFromLegacyValues;
	}

	if ( VALID_SORT_KEYS.includes( initialSort ) ) {
		return initialSort;
	}

	return 'relevance';
}

// This maps legacy order/orderby qs values into sort qs values.
function getSortFromOrderBy( query = getQuery() ) {
	const { order, orderby } = query;

	if ( 'date' === orderby ) {
		return typeof order === 'string' && order.toUpperCase() === SORT_DIRECTION_ASC
			? 'oldest'
			: 'newest';
	} else if ( 'relevance' === orderby ) {
		return 'relevance';
	}
	return null;
}

export function getSortQuery( initialSort = null ) {
	const query = getQuery();
	if ( VALID_SORT_KEYS.includes( query.sort ) ) {
		return query.sort;
	} else if ( VALID_SORT_KEYS.includes( initialSort ) ) {
		return initialSort;
	}
	return null;
}

export function setSortQuery( sort ) {
	if ( ! VALID_SORT_KEYS.includes( sort ) ) {
		return false;
	}

	const query = getQuery();
	query.sort = sort;
	delete query.order;
	delete query.orderby;
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

	if ( ! VALID_RESULT_FORMAT_KEYS.includes( query.result_format ) ) {
		return null;
	}

	return query.result_format;
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
