/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import get from 'lodash/get';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import {
	JETPACK_SITE_DATA_FETCH,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	JETPACK_SITE_DATA_FETCH_FAIL
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return assign( {}, action.siteData );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingSiteData: false
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH:
			return assign( {}, state, {
				isFetchingSiteData: true
			} );
		case JETPACK_SITE_DATA_FETCH_FAIL:
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteData: false
			} );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests
} );

/**
 * Returns true if currently requesting site data. Otherwise false.
 * otherwise.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether site data is being requested
 */
export function isFetchingSiteData( state ) {
	return !!state.jetpack.siteData.requests.isFetchingSiteData;
}

/**
 * Returns the plan of this site.
 * @param  {Object}  state Global state tree
 * @return {Object|Boolean}  Site plan
 */
export function getSitePlan( state ) {
	return get( state.jetpack.siteData, [ 'data', 'plan'], {} );
}
