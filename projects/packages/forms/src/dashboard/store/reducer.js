/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	SET_SELECTED_RESPONSES,
	RECEIVE_FILTERS,
	RECEIVE_COUNTS,
	INVALIDATE_COUNTS,
	SET_CURRENT_QUERY,
} from './action-types';

const filters = ( state = {}, action ) => {
	if ( action.type === RECEIVE_FILTERS ) {
		return action.filters;
	}
	return state;
};

const counts = ( state = null, action ) => {
	if ( action.type === RECEIVE_COUNTS ) {
		return action.counts;
	}
	return state;
};

const countsInvalidationKey = ( state = 0, action ) => {
	if ( action.type === INVALIDATE_COUNTS ) {
		return state + 1;
	}
	return state;
};

const currentQuery = ( state = {}, action ) => {
	if ( action.type === SET_CURRENT_QUERY ) {
		return action.currentQuery;
	}
	return state;
};

const selectedResponsesFromCurrentDataset = ( state = [], action ) => {
	if ( action.type === SET_SELECTED_RESPONSES ) {
		return action.selectedResponses;
	}
	return state;
};

export default combineReducers( {
	selectedResponsesFromCurrentDataset,
	filters,
	counts,
	countsInvalidationKey,
	currentQuery,
} );
