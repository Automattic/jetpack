/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
import { isEqual } from 'lodash';
/**
 * Internal dependencies
 */
import {
	SET_SELECTED_RESPONSES,
	RECEIVE_FILTERS,
	SET_CURRENT_QUERY,
	SET_COUNTS,
} from './action-types';

const filters = ( state = {}, action ) => {
	if ( action.type === RECEIVE_FILTERS ) {
		return action.filters;
	}
	return state;
};

const currentQuery = ( state = {}, action ) => {
	if ( action.type === SET_CURRENT_QUERY ) {
		return isEqual( state, action.currentQuery ) ? state : action.currentQuery;
	}
	return state;
};

const selectedResponsesFromCurrentDataset = ( state = [], action ) => {
	if ( action.type === SET_SELECTED_RESPONSES ) {
		return action.selectedResponses;
	}
	return state;
};

const counts = ( state = { inbox: 0, spam: 0, trash: 0 }, action ) => {
	if ( action.type === SET_COUNTS ) {
		return action.counts;
	}
	return state;
};

export default combineReducers( {
	selectedResponsesFromCurrentDataset,
	filters,
	currentQuery,
	counts,
} );
