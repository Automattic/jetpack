/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_RECOMMENDATIONS_DATA_FETCH,
	JETPACK_RECOMMENDATIONS_DATA_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_DATA_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_DATA_UPDATE,
	JETPACK_RECOMMENDATIONS_DATA_SAVE,
	JETPACK_RECOMMENDATIONS_DATA_SAVE_SUCCESS,
	JETPACK_RECOMMENDATIONS_DATA_SAVE_FAIL,
	JETPACK_RECOMMENDATIONS_STEP_UPDATE,
	JETPACK_RECOMMENDATIONS_STEP_UPDATE_SUCCESS,
	JETPACK_RECOMMENDATIONS_STEP_UPDATE_FAIL,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH_FAIL,
} from 'state/action-types';

export const fetchRecommendationsData = () => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_FETCH } );
		return restApi
			.fetchRecommendationsData()
			.then( data => {
				dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_FETCH_RECEIVE, data } );
			} )
			.catch( error => {
				dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_FETCH_FAIL, error } );
			} );
	};
};

export const updateRecommendationsData = data => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_UPDATE, data } );
	};
};

const saveRecommendations = ( dispatch, getState ) => {
	const recommendations = getState().jetpack.recommendations;
	dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_SAVE } );
	return restApi
		.saveRecommendationsData( recommendations.data )
		.then( () => {
			dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_SAVE_SUCCESS } );
		} )
		.catch( error => {
			dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_SAVE_FAIL, error } );
		} );
};

export const saveRecommendationsData = () => {
	return ( dispatch, getState ) => {
		return saveRecommendations( dispatch, getState );
	};
};

export const updateRecommendationsStep = step => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_STEP_UPDATE, step } );

		const recommendations = getState().jetpack.recommendations;
		return restApi
			.updateRecommendationsStep( recommendations.step )
			.then( () => {
				dispatch( { type: JETPACK_RECOMMENDATIONS_STEP_UPDATE_SUCCESS } );
			} )
			.catch( error => {
				dispatch( { type: JETPACK_RECOMMENDATIONS_STEP_UPDATE_FAIL, error } );
			} );
	};
};

export const fetchRecommendationsUpsell = () => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_UPSELL_FETCH } );
		return restApi
			.fetchRecommendationsUpsell()
			.then( upsell => {
				dispatch( { type: JETPACK_RECOMMENDATIONS_UPSELL_FETCH_RECEIVE, upsell } );
			} )
			.catch( error =>
				dispatch( {
					type: JETPACK_RECOMMENDATIONS_UPSELL_FETCH_FAIL,
					error,
					upsell: { hide_upsell: true },
				} )
			);
	};
};
