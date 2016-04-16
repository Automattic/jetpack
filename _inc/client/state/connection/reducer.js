/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS
} from 'state/action-types';

const requests = ( state = { disconnectingSite: false }, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE:
			return Object.assign( {}, state, { disconnectingSite: true } );
		case DISCONNECT_SITE_FAIL:
		case DISCONNECT_SITE_SUCCESS:
			return Object.assign( {}, state, { disconnectingSite: false } );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	requests
} );