/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { get, assign } from 'lodash';

/**
 * Internal dependencies
 */
import {
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE,
} from 'state/action-types';

const questionnaire = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE:
			return assign( {}, state, action.questionnaire );
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE:
			return assign( {}, state, action.answer );
		default:
			return state;
	}
};

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH:
			return assign( {}, state, { isFetchingSetupQuestionnaire: true } );
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE:
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL:
			return assign( {}, state, { isFetchingSetupQuestionnaire: false } );
		default:
			return state;
	}
};

export const reducer = combineReducers( { questionnaire, requests } );

export const isFetchingSetupWizardQuestionnaire = state => {
	return !! state.jetpack.setupWizard.requests.isFetchingSetupQuestionnaire;
};

export const getSetupWizardAnswer = ( state, question ) => {
	return get( state.jetpack.setupWizard.questionnaire, question );
};
