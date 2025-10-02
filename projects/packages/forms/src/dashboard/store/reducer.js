/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { SET_SELECTED_RESPONSES, RECEIVE_FILTERS, SET_CURRENT_QUERY } from './action-types';

// Keep the defaults in sync with the DataViews setup so the initial REST request
// matches the server-side preloaded response.
const DEFAULT_QUERY = {
	status: 'draft,publish',
	page: 1,
	per_page: 20,
	orderby: 'date',
	order: 'desc',
};

const filters = ( state = {}, action ) => {
	if ( action.type === RECEIVE_FILTERS ) {
		return action.filters;
	}
	return state;
};

const currentQuery = ( state = DEFAULT_QUERY, action ) => {
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
