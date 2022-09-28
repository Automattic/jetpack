import restApi from '@automattic/jetpack-api';
import {
	JETPACK_RECOMMENDATIONS_DATA_ADD_SELECTED_RECOMMENDATION,
	JETPACK_RECOMMENDATIONS_DATA_ADD_SKIPPED_RECOMMENDATION,
	JETPACK_RECOMMENDATIONS_DATA_ADD_VIEWED_RECOMMENDATION,
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
	JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH,
	JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH,
	JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_SITE_DISCOUNT_VIEWED,
	JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_START,
	JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_END,
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

export const addSelectedRecommendation = slug => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_ADD_SELECTED_RECOMMENDATION, slug } );
		return saveRecommendations( dispatch, getState );
	};
};

export const addSkippedRecommendation = slug => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_ADD_SKIPPED_RECOMMENDATION, slug } );
		return saveRecommendations( dispatch, getState );
	};
};

export const addViewedRecommendation = slug => {
	return ( dispatch, getState ) => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_DATA_ADD_VIEWED_RECOMMENDATION, slug } );
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

export const markSiteDiscountAsViewedInRecommendations = step => {
	return {
		type: JETPACK_RECOMMENDATIONS_SITE_DISCOUNT_VIEWED,
		step,
	};
};

export const fetchRecommendationsProductSuggestions = () => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH } );
		return restApi
			.fetchRecommendationsProductSuggestions()
			.then( productSuggestions => {
				dispatch( {
					type: JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_RECEIVE,
					productSuggestions,
				} );
			} )
			.catch( error =>
				dispatch( { type: JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_FAIL, error } )
			);
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

export const fetchRecommendationsConditional = () => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH } );
		return restApi
			.fetchRecommendationsConditional()
			.then( data => {
				dispatch( { type: JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_RECEIVE, data } );
			} )
			.catch( error =>
				dispatch( { type: JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_FAIL, error } )
			);
	};
};

export const startFeatureInstall = featureSlug => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_START, feature: featureSlug } );
	};
};

export const endFeatureInstall = featureSlug => {
	return dispatch => {
		dispatch( { type: JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_END, feature: featureSlug } );
	};
};
