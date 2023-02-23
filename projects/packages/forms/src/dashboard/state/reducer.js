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
} from './action-types';

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
	if ( action.type === JETPACK_FORMS_RESPONSES_FETCH && action.offset === 0 ) {
		return [];
	}

	if ( action.type === JETPACK_FORMS_RESPONSES_FETCH_RECEIVE ) {
		return [ ...action.responses ];
	}

	return state;
};

export const total = ( state = 0, action ) => {
	if ( action.type === JETPACK_FORMS_RESPONSES_FETCH && action.offset === 0 ) {
		return 0;
	}

	if ( action.type === JETPACK_FORMS_RESPONSES_FETCH_RECEIVE ) {
		return action.total;
	}

	return state;
};

export default combineReducers( {
	loading,
	responses,
	total,
} );
