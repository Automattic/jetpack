/**
 * External dependencies
 */
import { combineReducers } from 'redux';
/**
 * Internal dependencies
 */
import {
	JETPACK_FORMS_RESPONSES_FETCH,
	JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
	JETPACK_FORMS_RESPONSES_FETCH_FAIL,
} from '../action-types';

export const loading = ( state = false, action ) => {
	if ( action.type === JETPACK_FORMS_RESPONSES_FETCH ) {
		return true;
	}

	if (
		action.type === JETPACK_FORMS_RESPONSES_FETCH_RECEIVE ||
		action.type === JETPACK_FORMS_RESPONSES_FETCH_FAIL
	) {
		return false;
	}

	return state;
};

export const responses = ( state = [], action ) => {
	if ( action.type === JETPACK_FORMS_RESPONSES_FETCH_RECEIVE ) {
		return [ ...( action.append ? state : [] ), ...action.responses ];
	}

	return state;
};

export const reducer = combineReducers( {
	loading,
	responses,
} );

export const isFetchingResponses = state => state.jetpack.forms.loading;

export const getResponses = state => state.jetpack.forms.responses;
