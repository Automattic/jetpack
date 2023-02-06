import restApi from '@automattic/jetpack-api';
import {
	JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY,
	JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_SUCCESS,
	JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_FAIL,
} from 'state/action-types';

const dispatchSurvey = surveyResponse => dispatch => {
	dispatch( {
		type: JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY,
	} );

	return restApi
		.submitSurvey( surveyResponse )
		.then( data => {
			dispatch( {
				type: JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_SUCCESS,
			} );

			return data;
		} )
		.catch( error => {
			dispatch( {
				type: JETPACK_MARKETING_SUBMIT_DISCONNECT_SURVEY_FAIL,
				error: error.response,
			} );
		} );
};

export const submitSurvey = ( siteId, sitePlan, surveyAnswerId, surveyAnswerText, location ) => {
	const surveyResponse = {
		survey_id: 'calypso-disconnect-jetpack-july2019',
		site_id: siteId,
		survey_responses: {
			purchase: sitePlan.product_slug,
			'why-cancel': {
				response: surveyAnswerId,
			},
			source: {
				from: 'plugins' === location ? 'Jetpack-Plugins' : 'Jetpack-Dashboard',
			},
		},
	};

	if ( !! surveyAnswerText && '' !== surveyAnswerText ) {
		surveyResponse.survey_responses[ 'why-cancel' ].text = surveyAnswerText;
	}

	return dispatchSurvey( surveyResponse );
};
