import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	JETPACK_ACTION_NOTICES_DISMISS,
	JETPACK_NOTICES_DISMISS_SUCCESS,
	DISCONNECT_SITE_SUCCESS,
	RESET_OPTIONS_SUCCESS,
} from 'state/action-types';

const notice = ( state = false, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE_SUCCESS:
			return 'disconnected';

		default:
			return state;
	}
};

const dismissed = ( state = window.Initial_State.dismissedNotices, action ) => {
	switch ( action.type ) {
		case JETPACK_ACTION_NOTICES_DISMISS:
			return assign( {}, state, { [ action.notice ]: true } );

		case JETPACK_NOTICES_DISMISS_SUCCESS:
			return assign( {}, state, action.dismissedNotices );

		case RESET_OPTIONS_SUCCESS:
			return false;

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	notice,
	dismissed,
} );

/**
 * Returns any Jetpack notice hooked onto 'jetpack_notices' in PHP
 *
 * @param  {Object} state Global state tree
 * @return {bool|string}  False if no notice, string if there is.
 */
export function getJetpackNotices( state ) {
	return state.jetpack.jetpackNotices.notice;
}

/**
 * Returns any Jetpack notice error code hooked onto 'jetpack_notices' in PHP
 *
 * @param  {Object} state Global state tree
 * @return {number}  An error code.
 */
export function getJetpackStateNoticesErrorCode( state ) {
	return get( state.jetpack.initialState, [ 'jetpackStateNotices', 'errorCode' ] );
}

/**
 * Returns any Jetpack notice message code hooked onto 'jetpack_notices' in PHP
 *
 * @param  {Object} state Global state tree
 * @return {number}  A message code.
 */
export function getJetpackStateNoticesMessageCode( state ) {
	return get( state.jetpack.initialState, [ 'jetpackStateNotices', 'messageCode' ] );
}

/**
 * Returns the message content passed from PHP to the intial state of the app.
 *
 * @param {Object} state Global state tree
 * @return {string} The message content.
 */
export function getJetpackStateNoticesMessageContent( state ) {
	return get( state.jetpack.initialState, [ 'jetpackStateNotices', 'messageContent' ] );
}

/**
 * Returns any Jetpack notice error description hooked onto 'jetpack_notices' in PHP
 *
 * @param  {Object} state Global state tree
 * @return {string}  An error description.
 */
export function getJetpackStateNoticesErrorDescription( state ) {
	return get( state.jetpack.initialState, [ 'jetpackStateNotices', 'errorDescription' ] );
}

/**
 * Returns whether or not a Jetpack notice has been dismissed.
 *
 * @param  {Object} state  Global state tree
 * @param  {String} notice_name Name of the jetpack notice to check for.
 * @return {bool}          False if notice is still active, True if it's been dismissed.
 */
export function isNoticeDismissed( state, notice_name ) {
	return get( state.jetpack.jetpackNotices.dismissed, [ notice_name ], false );
}
