/**
 * Internal dependencies
 */
import { search } from '../../instant-search/lib/api';
import { setSearchResults } from './actions';

/**
 * Effect handler which will get the search results.
 *
 * @param {object} action - Action which had initiated the effect handler.
 * @param {object} store -  Store instance.
 */
function makeSearchAPIRequest( action, store ) {
	try {
		search( {
			aggregations: action.aggregations,
			filter: {},
			query: action.query,
			resultFormat: action.resultFormat,
			siteId: action.siteId,
		} ).then( response => {
			store.dispatch( setSearchResults( response?.results ?? [] ) );
		} );
	} catch ( error ) {
		// Refreshing connections failed
	}
}

export default {
	GET_SEARCH_RESULTS: makeSearchAPIRequest,
};
