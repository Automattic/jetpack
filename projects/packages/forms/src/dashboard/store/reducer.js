/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { SET_SELECTED_RESPONSES, RECEIVE_FILTERS, SET_CURRENT_QUERY } from './action-types';

const filters = ( state = {}, action ) => {
	if ( action.type === RECEIVE_FILTERS ) {
		return action.filters;
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
	currentQuery,
} );
