/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { hasError, isLoading, response } from './api';
import { staticFilters, filters, searchQuery, sort } from './query-string';
import { serverOptions } from './server-options';
import { isHistoryNavigation } from './history';

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
