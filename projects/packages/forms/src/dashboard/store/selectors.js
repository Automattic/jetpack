export const getFilters = state => state.filters;
export const getCounts = ( state, query ) => state.counts; // eslint-disable-line no-unused-vars
export const getCountsInvalidationKey = state => state.countsInvalidationKey ?? 0;
export const getCurrentQuery = state => state.currentQuery;
export const getCurrentStatus = state => state.currentQuery?.status ?? 'draft,publish';
export const getSelectedResponsesFromCurrentDataset = state =>
	state.selectedResponsesFromCurrentDataset;
export const getSelectedResponsesCount = state => state.selectedResponsesFromCurrentDataset.length;
