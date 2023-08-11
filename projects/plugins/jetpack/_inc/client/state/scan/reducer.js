import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	SCAN_STATUS_FETCH,
	SCAN_STATUS_FETCH_RECEIVE,
	SCAN_STATUS_FETCH_FAIL,
	MOCK_SWITCH_SCAN_STATE,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case SCAN_STATUS_FETCH_RECEIVE:
			return assign( {}, state, { status: action.status } );
		case MOCK_SWITCH_SCAN_STATE:
			return {
				status: {
					...state.status,
					...action.scanState,
				},
			};
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingScanStatus: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case SCAN_STATUS_FETCH:
			return assign( {}, state, {
				isFetchingScanStatus: true,
			} );
		case SCAN_STATUS_FETCH_RECEIVE:
		case SCAN_STATUS_FETCH_FAIL:
			return assign( {}, state, {
				isFetchingScanStatus: false,
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
 * Returns true if currently requesting scan. status. Otherwise false.
 *
 * @param  {object}  state - Global state tree
 * @returns {boolean}      Whether rewind status is being requested
 */
export function isFetchingScanStatus( state ) {
	return !! state.jetpack.scan.requests.isFetchingScanStatus;
}

/**
 * Returns the current status of scan.
 *
 * @param  {object}  state - Global state tree
 * @returns {object}  Features
 */
export function getScanStatus( state ) {
	return get( state.jetpack.scan, [ 'data', 'status' ], {} );
}
