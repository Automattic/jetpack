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
	RESPONSES_LOADING_SET,
	RESPONSES_QUERY_MONTH_UPDATE,
	RESPONSES_QUERY_RESET,
	RESPONSES_QUERY_SEARCH_UPDATE,
	RESPONSES_QUERY_SOURCE_UPDATE,
	RESPONSES_QUERY_STATUS_UPDATE,
	RESPONSES_SELECTION_SET,
} from './action-types';

const filters = ( state = {}, action ) => {
	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return action.filters;
	}

	return state;
};

const loading = ( state = false, action ) => {
	if ( action.type === RESPONSES_FETCH ) {
		return true;
	}

	if ( action.type === RESPONSES_FETCH_RECEIVE || action.type === RESPONSES_FETCH_FAIL ) {
		return false;
	}

	if ( action.type === RESPONSES_LOADING_SET ) {
		return action.loading;
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

const tabTotals = ( state = undefined, action ) => {
	if ( action.type === RESPONSES_FETCH_RECEIVE ) {
		return action.tabTotals;
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

	if ( action.type === RESPONSES_QUERY_MONTH_UPDATE ) {
		return {
			...state,
			month: action.month,
		};
	}

	if ( action.type === RESPONSES_QUERY_SOURCE_UPDATE ) {
		return {
			...state,
			parent_id: action.source,
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
	filters,
	loading,
	query,
	responses,
	tabTotals,
	total,
} );
