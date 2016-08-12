/**
 * External dependencies
 */
import assign from 'lodash/assign';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const initialState = ( state = window.Initial_State, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, state, action.initialState );

		default:
			return state;
	}
};

export function getSiteRoles( state ) {
	return get( state.jetpack.initialState.stats, 'roles', {} );
}

export function getAdminEmailAddress( state ) {
	return get( state.jetpack.initialState, [ 'userData', 'currentUser', 'wpcomUser', 'email' ] );
}

export function getSiteRawUrl( state ) {
	return get( state.jetpack.initialState, 'rawUrl', {} );
}

export function getSiteAdminUrl( state ) {
	return get( state.jetpack.initialState, 'adminUrl', {} );
}

export function isSitePublic( state ) {
	return get( state.jetpack.initialState, [ 'connectionStatus', 'isPublic' ] );
}

export function userCanManageModules( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'manage_modules', false );
}

export function userCanViewStats( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'view_stats', false );
}
