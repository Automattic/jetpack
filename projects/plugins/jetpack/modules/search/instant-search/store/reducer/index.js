/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { hasError, isLoading, response } from './api';
import { searchQuery, sort } from './query-string';
import { serverOptions } from './server-options';

export { hasError, isLoading, response, searchQuery, serverOptions, sort };
export default combineReducers( {
	hasError,
	isLoading,
	response,
	searchQuery,
	serverOptions,
	sort,
} );
