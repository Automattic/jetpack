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
	const roles = get( state.jetpack.initialState.stats, 'roles', {} );
	return roles;
}
