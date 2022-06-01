import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	REWIND_STATUS_FETCH,
	REWIND_STATUS_FETCH_RECEIVE,
	REWIND_STATUS_FETCH_FAIL,
	MOCK_SWITCH_REWIND_STATE,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case REWIND_STATUS_FETCH_RECEIVE:
			return assign( {}, state, { status: action.status } );
		case MOCK_SWITCH_REWIND_STATE:
			return assign( {}, state, { status: action.rewindState } );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingRewindStatus: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case REWIND_STATUS_FETCH:
			return assign( {}, state, {
				isFetchingRewindStatus: true,
			} );
		case REWIND_STATUS_FETCH_RECEIVE:
		case REWIND_STATUS_FETCH_FAIL:
			return assign( {}, state, {
				isFetchingRewindStatus: false,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
} );

/**
 * Returns true if currently requesting rewind status. Otherwise false.
 * otherwise.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether rewind status is being requested
 */
export function isFetchingRewindStatus( state ) {
	return !! state.jetpack.rewind.requests.isFetchingRewindStatus;
}

/**
 * Returns the current status of rewind
 * @param  {Object}  state Global state tree
 * @return {Object}  Features
 */
export function getRewindStatus( state ) {
	return get( state.jetpack.rewind, [ 'data', 'status' ], {} );
}
