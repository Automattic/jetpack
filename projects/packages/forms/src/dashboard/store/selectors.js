export const getFilters = state => state.filters;
export const getCurrentQuery = state => state.currentQuery;
export const getCurrentStatus = state => state.currentQuery?.status ?? 'draft,publish';
export const getSelectedResponsesFromCurrentDataset = state =>
	state.selectedResponsesFromCurrentDataset;
export const getSelectedResponsesCount = state => state.selectedResponsesFromCurrentDataset.length;
export const getCounts = state => state.counts;
export const getInboxCount = state => state.counts.inbox;
export const getSpamCount = state => state.counts.spam;
export const getTrashCount = state => state.counts.trash;
