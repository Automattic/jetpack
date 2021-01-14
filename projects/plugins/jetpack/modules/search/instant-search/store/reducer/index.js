/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { hasError, isLoading, response } from './api';
import { filters, searchQuery, sort } from './query-string';
import { serverOptions } from './server-options';

export { filters, hasError, isLoading, response, searchQuery, serverOptions, sort };
export default combineReducers( {
	filters,
	hasError,
	isLoading,
	response,
	searchQuery,
	serverOptions,
	sort,
} );
