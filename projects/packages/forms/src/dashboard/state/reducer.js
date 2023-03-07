/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	RESPONSES_FETCH,
	RESPONSES_FETCH_RECEIVE,
	RESPONSES_FETCH_FAIL,
	RESPONSES_QUERY_SEARCH_UPDATE,
} from './action-types';

const loading = ( state = false, action ) => {
	if ( action.type === RESPONSES_FETCH ) {
		return true;
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE || action.type === RESPONSES_FETCH_FAIL ) {
		return false;
	}

	return state;
};

const responses = ( state = [], action ) => {
	if ( action.type === RESPONSES_FETCH && action.offset === 0 ) {
		return [];
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return [ ...action.responses ];
	}

	return state;
};

const total = ( state = 0, action ) => {
	if ( action.type === RESPONSES_FETCH && action.offset === 0 ) {
		return 0;
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return action.total;
	}

	return state;
};

const searchQuery = ( state = '', action ) => {
	if ( action.type === RESPONSES_QUERY_SEARCH_UPDATE ) {
		return action.searchQuery;
	}

	return state;
};

export default combineReducers( {
	loading,
	responses,
	total,
	searchQuery,
} );
