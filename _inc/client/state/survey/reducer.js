/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get } from 'lodash';

/**
 * Internal dependencies
 */
import {
	JETPACK_MARKETING_SUBMIT_SURVEY,
	JETPACK_MARKETING_SUBMIT_SURVEY_SUCCESS,
	JETPACK_MARKETING_SUBMIT_SURVEY_FAIL,
} from 'state/action-types';

export const disconnectSurvey = (
	state = { submitting: false, submitted: false, error: null },
	action
) => {
	switch ( action.type ) {
		case JETPACK_MARKETING_SUBMIT_SURVEY:
			return assign( {}, state, {
				submitting: true,
			} );
		case JETPACK_MARKETING_SUBMIT_SURVEY_SUCCESS:
			return assign( {}, state, {
				submitting: false,
				submitted: true,
				error: null,
			} );
		case JETPACK_MARKETING_SUBMIT_SURVEY_FAIL:
			return assign( {}, state, {
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
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether email is being sent
 */
export function isSubmittingSurvey( state ) {
	return get( state, 'jetpack.disconnectSurvey.submitting', false );
}

/**
 * Returns true if a login email has been sent in the current state of the application.
 *
 * @param {Object}  state Global state tree.
 * @return {Boolean}      Whether email has been sent.
 */
export function hasSubmittedSurvey( state ) {
	return get( state, 'jetpack.disconnectSurvey.submitted', false );
}

/**
 * Returns an error object for the last magic login link or null.
 *
 * @param {Object}  state Global state tree.
 * @return {Object|null}  The error object if there is one.
 */
export function getSurveySubmitError( state ) {
	return get( state, 'jetpack.disconnectSurvey.error', null );
}
