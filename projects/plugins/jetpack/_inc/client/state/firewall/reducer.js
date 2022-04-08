/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get } from 'lodash';

/**
 * Internal dependencies
 */
import {
	WAF_BOOTSTRAP_PATH_FETCH,
	WAF_BOOTSTRAP_PATH_FETCH_RECEIVE,
	WAF_BOOTSTRAP_PATH_FETCH_FAIL,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case WAF_BOOTSTRAP_PATH_FETCH_RECEIVE:
			return assign( {}, state, { bootstrapPath: action.bootstrapPath } );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingBootstrapPath: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case WAF_BOOTSTRAP_PATH_FETCH:
			return assign( {}, state, {
				isFetchingBootstrapPath: true,
			} );
		case WAF_BOOTSTRAP_PATH_FETCH_RECEIVE:
		case WAF_BOOTSTRAP_PATH_FETCH_FAIL:
			return assign( {}, state, {
				isFetchingBootstrapPath: false,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
} );

/**
 * Returns true if currently requesting the firewall bootstrap file path. Otherwise false.
 *
 * @param  {object}  state - Global state tree
 * @returns {boolean}      Whether the bootstrap path is being requested
 */
export function isFetchingBootstrapPath( state ) {
	return !! state.jetpack.waf.requests.isFetchingBootstrapPath;
}

/**
 * Returns the firewall's bootstrap.php file path.
 *
 * @param  {object}  state - Global state tree
 * @returns {object}  Object containing the bootstrapPath
 */
export function getBootstrapPath( state ) {
	return get( state.jetpack.waf, [ 'data', 'bootstrapPath' ], {} );
}
