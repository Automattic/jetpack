import restApi from '@automattic/jetpack-api';
import {
	CUSTOM_FEATURE_ACTIVE_FETCH_FAIL,
	CUSTOM_FEATURE_ACTIVE_FETCH_SUCCESS,
	CUSTOM_FEATURE_ACTIVE_FETCH,
} from 'state/action-types';

/**
 * Fetch the status of the custom content types feature.
 *
 * @param {string} featureType - The custom content type to check.
 * @return {Function} The action.
 */
export const getActiveFeatureDetails = featureType => {
	return dispatch => {
		dispatch( {
			type: CUSTOM_FEATURE_ACTIVE_FETCH,
		} );
		return restApi
			.getFeatureTypeStatus( featureType )
			.then( data => {
				dispatch( {
					type: CUSTOM_FEATURE_ACTIVE_FETCH_SUCCESS,
					feature_data: data,
				} );
				return data;
			} )
			.catch( error => {
				dispatch( {
					type: CUSTOM_FEATURE_ACTIVE_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
