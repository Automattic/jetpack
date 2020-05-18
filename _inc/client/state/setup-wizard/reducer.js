/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign } from 'lodash';

/**
 * Internal dependencies
 */
import {
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE,
} from 'state/action-types';

const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE:
			return assign( {}, state, action.questionnaire );
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE:
			return assign( {}, state, action.answer );
	}
};

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH:
			return assign( {}, state, { isFetchingSetupQuestionnaire: true } );
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE:
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL:
			return assign( {}, state, { isFetchingSetupQuestionnaire: false } );
	}
};

export const reducer = combineReducers( { data, requests } );

export const isFetchingSetupWizardQuestionnaire = state => {
	return !! state.jetpack.setupWizard.requests.isFetchingSetupQuestionnaire;
};
