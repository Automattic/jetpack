/**
 * Internal dependencies
 */
import { combineReducers } from 'redux';
import { SITE_CHECKLIST_RECEIVE, SITE_CHECKLIST_REQUEST } from 'state/action-types';

export function isLoading( initialState = false, action ) {
	switch ( action.type ) {
		case SITE_CHECKLIST_REQUEST:
			return true;
		case SITE_CHECKLIST_RECEIVE:
			return false;
	}
	return initialState;
}

export function checklist( initialState = null, action ) {
	if ( action.type === SITE_CHECKLIST_RECEIVE ) {
		return action.checklist;
	}
	return initialState;
}

export default combineReducers( {
	checklist,
	isLoading,
} );
