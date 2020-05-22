/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_SAVE_SUCCESS,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_SAVE_FAIL,
} from 'state/action-types';

export const fetchSetupWizardQuestionnaire = () => {
	return dispatch => {
		dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH } );
		return restApi
			.fetchSetupQuestionnaire()
			.then( questionnaire => {
				dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE, questionnaire } );
			} )
			.catch( error => {
				dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL, error } );
			} );
	};
};

export const updateSetupWizardQuestionnaire = answer => {
	return dispatch => {
		dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE, answer } );
	};
};

export const saveSetupWizardQuestionnnaire = () => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE } );
		return restApi
			.saveSetupQuestionnaire( getState().jetpack.setupWizard.questionnaire )
			.then( () => {
				dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_SAVE_SUCCESS } );
			} )
			.catch( error => dispatch( { type: JETPACK_SETUP_WIZARD_QUESTIONNAIRE_SAVE_FAIL, error } ) );
	};
};
