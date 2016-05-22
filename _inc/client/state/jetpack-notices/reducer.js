
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
	JETPACK_NOTICES_DISMISS,
	JETPACK_NOTICES_DISMISS_FAIL,
	JETPACK_NOTICES_DISMISS_SUCCESS,
	DISCONNECT_SITE_SUCCESS
} from 'state/action-types';
import restApi from 'rest-api';

const status = ( state = false , action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE_SUCCESS:
			return 'disconnected';

		default:
			return state;
	}
};

const dismissed = ( state = window.Initial_State.dismissedNotices, action ) => {
	switch ( action.type ) {
		case JETPACK_NOTICES_DISMISS_SUCCESS:
			return assign( {}, state, action.dismissedNotices );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	status,
	dismissed
} );

/**
 * Returns any Jetpack notice hooked onto 'jetpack_notices' in PHP
 *
 * @param  {Object} state Global state tree
 * @return {bool|string}  False if no notice, string if there is.
 */
export function getJetpackNotices( state ) {
	return state.jetpack.jetpackNotices.status;
}

/**
 * Returns whether or not a Jetpack notice has been dismissed.
 *
 * @param  {Object} state  Global state tree
 * @param  {String} notice Name of the jetpack notice to check for.
 * @return {bool}          False if notice is still active, True if it's been dismissed.
 */
export function isNoticeDismissed( state, notice ) {
	return get( state.jetpack.jetpackNotices.dismissed, [ notice ], false );
}
