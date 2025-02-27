const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

export const getFilters = state => state.filters || EMPTY_OBJECT;
export const getCurrentQuery = state => state.currentQuery || EMPTY_OBJECT;
export const getSelectedResponsesFromCurrentDataset = state =>
	state.selectedResponsesFromCurrentDataset || EMPTY_ARRAY;
