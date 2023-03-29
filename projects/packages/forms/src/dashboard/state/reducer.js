/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	RESPONSES_CURRENT_PAGE_SET,
	RESPONSES_FETCH,
	RESPONSES_FETCH_FAIL,
	RESPONSES_FETCH_RECEIVE,
	RESPONSES_QUERY_RESET,
	RESPONSES_QUERY_SEARCH_UPDATE,
	RESPONSES_QUERY_STATUS_UPDATE,
	RESPONSES_SELECTION_SET,
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

const currentPage = ( state = 1, action ) => {
	if (
		action.type === RESPONSES_QUERY_RESET ||
		action.type === RESPONSES_QUERY_STATUS_UPDATE ||
		action.type === RESPONSES_QUERY_SEARCH_UPDATE
	) {
		return 1;
	}

	if ( action.type === RESPONSES_CURRENT_PAGE_SET ) {
		return action.page;
	}

	return state;
};

const query = ( state = {}, action ) => {
	if ( action.type === RESPONSES_QUERY_RESET ) {
		return {};
	}

	if ( action.type === RESPONSES_QUERY_SEARCH_UPDATE ) {
		return {
			...state,
			search: action.search,
		};
	}

	if ( action.type === RESPONSES_QUERY_STATUS_UPDATE ) {
		return {
			...state,
			status: action.status,
		};
	}

	return state;
};

const currentSelection = ( state = [], action ) => {
	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return [];
	}

	if ( action.type === RESPONSES_SELECTION_SET ) {
		return action.selectedResponses;
	}

	return state;
};

export default combineReducers( {
	currentPage,
	currentSelection,
	loading,
	query,
	responses,
	total,
} );
