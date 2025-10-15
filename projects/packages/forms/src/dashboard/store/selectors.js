/**
 * Internal dependencies
 */
import { getCacheKey } from './reducer';

export const getFilters = state => state.filters;
export const getCurrentQuery = state => state.currentQuery;
export const getCurrentStatus = state => state.currentQuery?.status ?? 'draft,publish';
export const getSelectedResponsesFromCurrentDataset = state =>
	state.selectedResponsesFromCurrentDataset;
export const getSelectedResponsesCount = state => state.selectedResponsesFromCurrentDataset.length;

/**
 * Get counts with query parameters.
 * This selector works with a resolver to fetch counts based on query params.
 *
 * @param {object} state       - The current state.
 * @param {object} queryParams - Query parameters for filtering counts (used by resolver).
 * @return {object} The counts object.
 */
export const getCounts = ( state, queryParams = {} ) => {
	const cacheKey = getCacheKey( queryParams );
	return state.counts[ cacheKey ] || { inbox: 0, spam: 0, trash: 0 };
};

export const getInboxCount = ( state, queryParams = {} ) => {
	const counts = getCounts( state, queryParams );
	return counts.inbox;
};

export const getSpamCount = ( state, queryParams = {} ) => {
	const counts = getCounts( state, queryParams );
	return counts.spam;
};

export const getTrashCount = ( state, queryParams = {} ) => {
	const counts = getCounts( state, queryParams );
	return counts.trash;
};
