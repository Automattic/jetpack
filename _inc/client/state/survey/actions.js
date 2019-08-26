/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_MARKETING_SUBMIT_SURVEY,
	JETPACK_MARKETING_SUBMIT_SURVEY_SUCCESS,
	JETPACK_MARKETING_SUBMIT_SURVEY_FAIL,
} from 'state/action-types';
// import { translate as __ } from 'i18n-calypso';
// import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';

export const submitSurvey = surveyInfo => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MARKETING_SUBMIT_SURVEY,
		} );
		// dispatch( removeNotice( 'mobile-login-email-send' ) );
		// dispatch( removeNotice( 'mobile-login-email-sent' ) );
		// dispatch( removeNotice( 'mobile-login-email-error' ) );
		// dispatch(
		// 	createNotice( 'is-info', __( 'Sending login email…' ), {
		// 		id: 'mobile-login-email-send',
		// 	} )
		// );
		return restApi
			.submitSurvey( surveyInfo )
			.then( data => {
				// dispatch( removeNotice( 'mobile-login-email-send' ) );
				dispatch( {
					type: JETPACK_MARKETING_SUBMIT_SURVEY_SUCCESS,
				} );
				// dispatch(
				// 	createNotice( 'is-success', __( 'Login email sent' ), {
				// 		id: 'mobile-login-email-sent',
				// 		duration: 2000,
				// 	} )
				// );

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MARKETING_SUBMIT_SURVEY_FAIL,
					error: error.response,
				} );
				// dispatch( removeNotice( 'mobile-login-email-send' ) );
				// dispatch(
				// 	createNotice( 'is-error', __( 'Failed to send login email' ), {
				// 		id: 'mobile-login-email-error',
				// 	} )
				// );
			} );
	};
};
