import { assign } from 'lodash';
import { combineReducers } from 'redux';
import {
	CUSTOM_FEATURE_ACTIVE_FETCH_FAIL,
	CUSTOM_FEATURE_ACTIVE_FETCH_SUCCESS,
	CUSTOM_FEATURE_ACTIVE_FETCH,
} from 'state/action-types';

export const items = ( state = { fetchingCustomContentTypeStatus: false }, action ) => {
	switch ( action.type ) {
		case CUSTOM_FEATURE_ACTIVE_FETCH:
			return assign( {}, state, { fetchingCustomContentTypeStatus: true } );
		case CUSTOM_FEATURE_ACTIVE_FETCH_SUCCESS:
			return {
				...state,
				fetchingCustomContentTypeStatus: false,
				customContentTypeActive: action.customContentTypeActive,
				sub_features: action.sub_features || {}, // Store sub-features
			};
		case CUSTOM_FEATURE_ACTIVE_FETCH_FAIL:
			return { ...state, fetchingCustomContentTypeStatus: false, error: action.error };
		default:
			return state;
	}
};

const requests = ( state = { fetchingCustomContentTypeStatus: false }, action ) => {
	switch ( action.type ) {
		case CUSTOM_FEATURE_ACTIVE_FETCH:
			return assign( {}, state, {
				fetchingCustomContentTypeStatus: true,
			} );
		case CUSTOM_FEATURE_ACTIVE_FETCH_FAIL:
		case CUSTOM_FEATURE_ACTIVE_FETCH_SUCCESS:
			return assign( {}, state, {
				fetchingCustomContentTypeStatus: false,
			} );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests,
} );
