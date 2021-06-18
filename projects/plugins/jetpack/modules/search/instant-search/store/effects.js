/**
 * Internal dependencies
 */
import { search } from '../lib/api';
import { SORT_DIRECTION_ASC, VALID_SORT_KEYS } from '../lib/constants';
import { getFilterKeys } from '../lib/filters';
import { getQuery, setQuery } from '../lib/query-string';
import {
	clearFilters,
	recordFailedSearchRequest,
	recordSuccessfulSearchRequest,
	setFilter,
	setSearchQuery,
	setSort,
} from './actions';

let requestCounter = 0;
let queryStringIntegrationEnabled = true;

/**
 * Effect handler which will fetch search results from the API.
 *
 * @param {object} action - Action which had initiated the effect handler.
 * @param {object} store -  Store instance.
 */
function makeSearchAPIRequest( action, store ) {
	requestCounter++;
	search( action.options, requestCounter )
		.then( response => {
			if ( response === null ) {
				// Request has been cancelled by a more recent request.
				return;
			}

			store.dispatch( recordSuccessfulSearchRequest( { options: action.options, response } ) );
		} )
		.catch( error => {
			// eslint-disable-next-line no-console
			console.error( 'Jetpack Search encountered an error:', error );
			store.dispatch( recordFailedSearchRequest( error ) );
		} );
}

/**
 * Initialize query values from the browser's address bar.
 *
 * @param {object} action - Action which had initiated the effect handler.
 * @param {object} store -  Store instance.
 */
function initializeQueryValues( action, store ) {
	const queryObject = getQuery();

	//
	// Initialize search query value for the reducer.
	//
	if ( 's' in queryObject ) {
		store.dispatch( setSearchQuery( queryObject.s, false ) );
	} else {
		store.dispatch( setSearchQuery( null, false ) );
	}

	//
	// Initialize sort value for the reducer.
	//
	let sort;
	if ( VALID_SORT_KEYS.includes( queryObject.sort ) ) {
		// Set sort value from `sort` query value.
		sort = queryObject.sort;
	} else if ( 'date' === queryObject.orderby ) {
		// Set sort value from legacy `orderby` query value.
		sort =
			typeof queryObject.order === 'string' &&
			queryObject.order.toUpperCase() === SORT_DIRECTION_ASC
				? 'oldest'
				: 'newest';
	} else if ( 'relevance' === queryObject.orderby ) {
		// Set sort value from legacy `orderby` query value.
		sort = 'relevance';
	}
	typeof sort === 'string' && store.dispatch( setSort( sort, false ) );

	//
	// Initialize filter value for the reducer.
	//
	store.dispatch( clearFilters( false ) );
	getFilterKeys()
		.filter( filterKey => filterKey in queryObject )
		.forEach( filterKey =>
			store.dispatch( setFilter( filterKey, queryObject[ filterKey ], false ) )
		);
}

/**
 * Effect handler which will update the location bar's search query string
 *
 * @param {object} action - Action which had initiated the effect handler.
 */
function updateSearchQueryString( action ) {
	if ( action.propagateToWindow === false || ! queryStringIntegrationEnabled ) {
		return;
	}

	const queryObject = getQuery();

	if ( action.query !== null ) {
		queryObject.s = action.query;
	} else {
		delete queryObject.s;
	}

	setQuery( queryObject );
}

/**
 * Effect handler which will update the location bar's sort query string
 *
 * @param {object} action - Action which had initiated the effect handler.
 */
function updateSortQueryString( action ) {
	if ( action.propagateToWindow === false || ! queryStringIntegrationEnabled ) {
		return;
	}
	if ( ! VALID_SORT_KEYS.includes( action.sort ) ) {
		return;
	}

	const queryObject = getQuery();
	queryObject.sort = action.sort;

	// Removes legacy sort query values, just in case.
	delete queryObject.order;
	delete queryObject.orderby;

	setQuery( queryObject );
}

/**
 * Effect handler which will update the location bar's filter query string
 *
 * @param {object} action - Action which had initiated the effect handler.
 */
function updateFilterQueryString( action ) {
	if ( action.propagateToWindow === false || ! queryStringIntegrationEnabled ) {
		return;
	}
	if ( ! getFilterKeys().includes( action.name ) ) {
		return;
	}

	const queryObject = getQuery();
	queryObject[ action.name ] = action.value;
	setQuery( queryObject );
}

/**
 * Effect handler which will clear filter queries from the location bar
 *
 * @param {object} action - Action which had initiated the effect handler.
 */
function clearFilterQueryString( action ) {
	if ( action.propagateToWindow === false || ! queryStringIntegrationEnabled ) {
		return;
	}

	const queryObject = getQuery();
	getFilterKeys().forEach( key => delete queryObject[ key ] );
	setQuery( queryObject );
}

/**
 * Effect handler to disable query string integration for all effects.
 */
function disableQueryStringIntegration() {
	queryStringIntegrationEnabled = false;
}

export default {
	CLEAR_FILTERS: clearFilterQueryString,
	DISABLE_QUERY_STRING_INTEGRATION: disableQueryStringIntegration,
	INITIALIZE_QUERY_VALUES: initializeQueryValues,
	MAKE_SEARCH_REQUEST: makeSearchAPIRequest,
	SET_FILTER: updateFilterQueryString,
	SET_SEARCH_QUERY: updateSearchQueryString,
	SET_SORT: updateSortQueryString,
};
