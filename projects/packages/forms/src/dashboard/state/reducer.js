/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	INBOX_CURRENT_PAGE,
	INBOX_SEARCH,
	RESPONSES_FETCH,
	RESPONSES_FETCH_RECEIVE,
	RESPONSES_FETCH_FAIL,
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

const search = ( state = '', action ) => {
	if ( action.type === INBOX_SEARCH ) {
		return action.search;
	}

	return state;
};

const currentPage = ( state = 1, action ) => {
	if ( action.type === INBOX_CURRENT_PAGE ) {
		return action.currentPage;
	}

	if ( action.type === INBOX_SEARCH ) {
		return 1;
	}

	return state;
};

export default combineReducers( {
	loading,
	responses,
	total,
	search,
	currentPage,
} );
