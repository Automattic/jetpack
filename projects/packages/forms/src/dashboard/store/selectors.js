/**
 * Internal dependencies
 */
import { getCacheKey } from './reducer.js';

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

/**
 * Get set of invalid record IDs.
 *
 * @param {object} state - Store state.
 * @return {Set<number>} Set of invalid record IDs.
 */
export const getInvalidRecords = state => {
	return state.invalidRecords || new Set();
};

/**
 * Check if a specific record is marked as invalid.
 *
 * @param {object} state    - Store state.
 * @param {number} recordId - Record ID to check.
 * @return {boolean} Whether the record is invalid.
 */
export const isRecordInvalid = ( state, recordId ) => {
	return state.invalidRecords?.has( recordId ) || false;
};

/**
 * Get set of pending action IDs.
 *
 * @param {object} state - Store state.
 * @return {Set<string>} Set of pending action IDs.
 */
export const getPendingActions = state => {
	return state.pendingActions || new Set();
};

/**
 * Check if there are any pending actions.
 *
 * @param {object} state - Store state.
 * @return {boolean} Whether there are pending actions.
 */
export const hasPendingActions = state => {
	return ( state.pendingActions?.size ?? 0 ) > 0;
};

/**
 * Get the form (jetpack_form) per-status counts.
 *
 * @param {object} state - The current state.
 * @return {object|null} The form status counts object, or null if not yet loaded.
 */
export const getFormStatusCounts = state => {
	return state.formStatusCounts;
};
