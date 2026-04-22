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
	MARK_RECORDS_AS_INVALID,
	CLEAR_INVALID_RECORDS,
	ADD_PENDING_ACTION,
	REMOVE_PENDING_ACTION,
	SET_FORM_STATUS_COUNTS,
} from './action-types.js';

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
		fields_format: 'collection',
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

const normalizeValue = value => {
	if ( Array.isArray( value ) ) {
		return value.slice().sort().join( ',' );
	}
	if ( typeof value === 'boolean' ) {
		return value ? '1' : '0';
	}
	return String( value );
};

/**
 * Generate a stable cache key from query parameters.
 *
 * @param {object} queryParams - Query parameters for filtering counts.
 * @return {string} A stable key for caching.
 */
export const getCacheKey = ( queryParams = {} ) => {
	const keys = [ 'search', 'parent', 'source', 'before', 'after', 'is_unread' ];
	const parts = keys
		.filter( key => queryParams[ key ] !== undefined )
		.map( key => `${ key }:${ normalizeValue( queryParams[ key ] ) }` );
	return parts.length > 0 ? parts.join( '|' ) : 'default';
};

const counts = ( state = {}, action ) => {
	if ( action.type === SET_COUNTS ) {
		const cacheKey = getCacheKey( action.queryParams );
		return {
			...state,
			[ cacheKey ]: action.counts,
		};
	}
	if ( action.type === UPDATE_COUNTS_OPTIMISTICALLY ) {
		const { fromStatus, toStatus, count, queryParams } = action;
		const cacheKey = getCacheKey( queryParams );
		const currentCounts = state[ cacheKey ] || { inbox: 0, spam: 0, trash: 0 };
		const newCounts = { ...currentCounts };

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

		return {
			...state,
			[ cacheKey ]: newCounts,
		};
	}
	return state;
};

const invalidRecords = ( state = new Set(), action ) => {
	if ( action.type === MARK_RECORDS_AS_INVALID ) {
		return new Set( [ ...state, ...action.recordIds ] );
	}
	if ( action.type === CLEAR_INVALID_RECORDS ) {
		return new Set();
	}
	return state;
};

const pendingActions = ( state = new Set(), action ) => {
	if ( action.type === ADD_PENDING_ACTION ) {
		return new Set( [ ...state, action.actionId ] );
	}

	if ( action.type === REMOVE_PENDING_ACTION ) {
		const newState = new Set( state );
		newState.delete( action.actionId );

		return newState;
	}

	return state;
};

const formStatusCounts = ( state = null, action ) => {
	if ( action.type === SET_FORM_STATUS_COUNTS ) {
		return action.formStatusCounts;
	}
	return state;
};

export default combineReducers( {
	selectedResponsesFromCurrentDataset,
	filters,
	currentQuery,
	counts,
	invalidRecords,
	pendingActions,
	formStatusCounts,
} );
