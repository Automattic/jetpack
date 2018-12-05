/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import get from 'lodash/get';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import {
	JITM_FETCH,
	JITM_FETCH_RECEIVE,
	JITM_FETCH_FAIL,
	JITM_DISMISS,
	JITM_DISMISS_SUCCESS,
	JITM_DISMISS_FAIL
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JITM_FETCH_RECEIVE:
			return assign( {}, state, { message: action.message } );
		case JITM_DISMISS_SUCCESS:
			return assign( {}, state, { response: action.response } );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingJitm: false,
	isDismissingJitm: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JITM_FETCH:
			return assign( {}, state, {
				isFetchingJitm: true
			} );
		case JITM_FETCH_RECEIVE:
		case JITM_FETCH_FAIL:
			return assign( {}, state, {
				isFetchingJitm: false
			} );
		case JITM_DISMISS:
			return assign( {}, state, {
				isDismissingJitm: true
			} );
		case JITM_DISMISS_SUCCESS:
		case JITM_DISMISS_FAIL:
			return assign( {}, state, {
				isDismissingJitm: false
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests
} );

/**
 * Returns true if currently requesting a JITM message. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether a JITM is being requested
 */
export function isFetchingJitm( state ) {
	return !! state.jetpack.jitm.requests.isFetchingJitm;
}

/**
 * Returns true if currently requesting the dismissal of a JITM message. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether a JITM is being dismissed.
 */
export function isDismissingJitm( state ) {
	return !! state.jetpack.jitm.requests.isDismissingJitm;
}

/**
 * Returns the current JITM message
 * @param  {Object}  state Global state tree
 * @return {Object}  Features
 */
export function getJitm( state ) {
	return get( state.jetpack.jitm, [ 'data', 'message' ], {} );
}

/**
 * Dismiss the current JITM message
 * @param  {Object}  state Global state tree
 * @return {Object}  Response
 */
export function getJitmDismissalResponse( state ) {
	return get( state.jetpack.jitm, [ 'data', 'response' ], {} );
}
