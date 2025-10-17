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
// eslint-disable-next-line no-unused-vars
export const getCounts = ( state, queryParams ) => state.counts;

export const getInboxCount = state => state.counts.inbox;
export const getSpamCount = state => state.counts.spam;
export const getTrashCount = state => state.counts.trash;
