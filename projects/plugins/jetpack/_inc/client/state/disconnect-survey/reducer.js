import { combineReducers } from 'redux';
import {
	JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY,
	JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_SUCCESS,
	JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_FAIL,
} from 'state/action-types';

export const disconnectSurvey = (
	state = { submitting: false, submitted: false, error: null },
	action
) => {
	switch ( action.type ) {
		case JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY:
			return Object.assign( {}, state, {
				submitting: true,
			} );
		case JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_SUCCESS:
			return Object.assign( {}, state, {
				submitting: false,
				submitted: true,
				error: null,
			} );
		case JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_FAIL:
			return Object.assign( {}, state, {
				submitting: false,
				submitted: false,
				error: action.error,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	disconnectSurvey,
} );

/**
 * Returns true if currently trying to send a login email
 *
 * @param {object} state - Global state tree
 * @return {boolean}       Whether email is being sent
 */
export function isSubmittingDisconnectSurvey( state ) {
	return state?.jetpack?.disconnectSurvey?.submitting ?? false;
}

/**
 * Returns true if a login email has been sent in the current state of the application.
 *
 * @param {object} state - Global state tree.
 * @return {boolean}      Whether email has been sent.
 */
export function hasSubmittedDisconnectSurvey( state ) {
	return state?.jetpack?.disconnectSurvey?.submitted ?? false;
}

/**
 * Returns an error object for the last magic login link or null.
 *
 * @param {object} state - Global state tree.
 * @return {Object|null}  The error object if there is one.
 */
export function getDisconnectSurveySubmitError( state ) {
	return state?.jetpack?.disconnectSurvey?.error ?? null;
}
