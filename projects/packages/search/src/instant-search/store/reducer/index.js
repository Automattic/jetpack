import { combineReducers } from 'redux';
import { hasError, isLoading, response } from './api';
import { isHistoryNavigation } from './history';
import { staticFilters, filters, searchQuery, sort } from './query-string';
import { serverOptions } from './server-options';

export {
	filters,
	staticFilters,
	hasError,
	isHistoryNavigation,
	isLoading,
	response,
	searchQuery,
	serverOptions,
	sort,
};
export default combineReducers( {
	filters,
	staticFilters,
	hasError,
	isLoading,
	isHistoryNavigation,
	response,
	searchQuery,
	serverOptions,
	sort,
} );
