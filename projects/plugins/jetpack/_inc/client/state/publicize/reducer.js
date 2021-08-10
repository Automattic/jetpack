/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get } from 'lodash';
import { ActionTypes as InitialStateActionTypes } from '@automattic/jetpack-initial-state';
const { JETPACK_SET_INITIAL_STATE } = InitialStateActionTypes;

export const connectUrls = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, action.initialState.externalServicesConnectUrls );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	connectUrls,
} );

/**
 * Return a connect url for a given service name.
 *
 * @param  {Object}  state   Global state tree.
 * @param  {String}  serviceName   Name of the external service.
 * @return {String}  Url to connect to the service or null.
 */
export function getExternalServiceConnectUrl( state, serviceName ) {
	return get( state.jetpack.publicize.connectUrls, serviceName, null );
}
