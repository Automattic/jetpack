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
	SET_CURRENT_QUERY,
	SET_COUNTS,
	UPDATE_COUNTS_OPTIMISTICALLY,
} from './action-types';

const filters = ( state = {}, action ) => {
	if ( action.type === RECEIVE_FILTERS ) {
		return action.filters;
	}
	return state;
};

const currentQuery = (
	state = {
		order: 'desc',
		orderby: 'date',
		page: 1,
		per_page: 20,
		status: 'draft,publish',
	},
	action
) => {
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

const counts = ( state = { inbox: 0, spam: 0, trash: 0 }, action ) => {
	if ( action.type === SET_COUNTS ) {
		return action.counts;
	}
	if ( action.type === UPDATE_COUNTS_OPTIMISTICALLY ) {
		const { fromStatus, toStatus, count } = action;
		const newCounts = { ...state };

		// Decrease from status
		if ( fromStatus === 'inbox' || fromStatus === 'publish' || fromStatus === 'draft' ) {
			newCounts.inbox = Math.max( 0, newCounts.inbox - count );
		} else if ( fromStatus === 'spam' ) {
			newCounts.spam = Math.max( 0, newCounts.spam - count );
		} else if ( fromStatus === 'trash' ) {
			newCounts.trash = Math.max( 0, newCounts.trash - count );
		}

		// Increase to status (unless permanently deleted)
		if ( toStatus === 'publish' || toStatus === 'draft' ) {
			newCounts.inbox += count;
		} else if ( toStatus === 'spam' ) {
			newCounts.spam += count;
		} else if ( toStatus === 'trash' ) {
			newCounts.trash += count;
		}

		return newCounts;
	}
	return state;
};

export default combineReducers( {
	selectedResponsesFromCurrentDataset,
	filters,
	currentQuery,
	counts,
} );
