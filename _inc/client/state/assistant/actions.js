/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_ASSISTANT_DATA_FETCH,
	JETPACK_ASSISTANT_DATA_FETCH_RECEIVE,
	JETPACK_ASSISTANT_DATA_FETCH_FAIL,
	JETPACK_ASSISTANT_DATA_UPDATE,
	JETPACK_ASSISTANT_DATA_SAVE,
	JETPACK_ASSISTANT_DATA_SAVE_SUCCESS,
	JETPACK_ASSISTANT_DATA_SAVE_FAIL,
	JETPACK_ASSISTANT_STEP_UPDATE,
	JETPACK_ASSISTANT_STEP_UPDATE_SUCCESS,
	JETPACK_ASSISTANT_STEP_UPDATE_FAIL,
} from 'state/action-types';

export const fetchAssistantData = () => {
	return dispatch => {
		dispatch( { type: JETPACK_ASSISTANT_DATA_FETCH } );
		return restApi
			.fetchAssistantData()
			.then( data => {
				dispatch( { type: JETPACK_ASSISTANT_DATA_FETCH_RECEIVE, data } );
			} )
			.catch( error => {
				dispatch( { type: JETPACK_ASSISTANT_DATA_FETCH_FAIL, error } );
			} );
	};
};

export const updateAssistantData = answer => {
	return dispatch => {
		dispatch( { type: JETPACK_ASSISTANT_DATA_UPDATE, answer } );
	};
};

export const saveAssistantData = () => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_ASSISTANT_DATA_SAVE } );

		const assistant = getState().jetpack.assistant;
		return restApi
			.saveAssistantData( assistant.data )
			.then( () => {
				dispatch( { type: JETPACK_ASSISTANT_DATA_SAVE_SUCCESS } );
			} )
			.catch( error => {
				dispatch( { type: JETPACK_ASSISTANT_DATA_SAVE_FAIL, error } );
			} );
	};
};

export const updateAssistantStep = step => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_ASSISTANT_STEP_UPDATE, step } );

		const assistant = getState().jetpack.assistant;
		return restApi
			.updateAssistantStep( assistant.step )
			.then( () => {
				dispatch( { type: JETPACK_ASSISTANT_STEP_UPDATE_SUCCESS } );
			} )
			.catch( error => {
				dispatch( { type: JETPACK_ASSISTANT_STEP_UPDATE_FAIL, error } );
			} );
	};
};
