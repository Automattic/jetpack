/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import get from 'lodash/get';
import assign from 'lodash/assign';
import merge from 'lodash/merge';

/**
 * Internal dependencies
 */
import {
	JETPACK_SITE_DATA_FETCH,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	JETPACK_SITE_DATA_FETCH_FAIL,
	JETPACK_SITE_FEATURES_FETCH,
	JETPACK_SITE_FEATURES_FETCH_RECEIVE,
	JETPACK_SITE_FEATURES_FETCH_FAIL,
	JETPACK_SITE_PLANS_FETCH,
	JETPACK_SITE_PLANS_FETCH_RECEIVE,
	JETPACK_SITE_PLANS_FETCH_FAIL,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return assign( {}, state, action.siteData );
		case JETPACK_SITE_FEATURES_FETCH_RECEIVE:
			return merge( {}, state, { site: { features: action.siteFeatures } } );
		case JETPACK_SITE_PLANS_FETCH_RECEIVE:
			return merge( {}, state, { sitePlans: action.plans } );
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
		case JETPACK_SITE_FEATURES_FETCH:
			return assign( {}, state, {
				isFetchingSiteFeatures: true
			} );
		case JETPACK_SITE_PLANS_FETCH:
			return assign( {}, state, {
				isFetchingSitePlans: true
			} );
		case JETPACK_SITE_DATA_FETCH_FAIL:
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteData: false
			} );
		case JETPACK_SITE_FEATURES_FETCH_FAIL:
		case JETPACK_SITE_FEATURES_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteFeatures: false
			} );
		case JETPACK_SITE_PLANS_FETCH_FAIL:
		case JETPACK_SITE_PLANS_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSitePlans: false
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
	return !! (
		state.jetpack.siteData.requests.isFetchingSiteData &&
		state.jetpack.siteData.requests.isFetchingSiteFeatures &&
		state.jetpack.siteData.requests.isFetchingSitePlans
	);
}

/**
 * Returns the plan of this site.
 * @param  {Object}  state Global state tree
 * @return {Object|Boolean}  Site plan
 */
export function getSitePlan( state ) {
	return get( state.jetpack.siteData, [ 'data', 'plan' ], {} );
}

/**
 * Returns features that are available on any plan.
 * @param  {Object}  state Global state tree
 * @return {Object}  Features
 */
export function getAvailableFeatures( state ) {
	return get( state.jetpack.siteData, [ 'data', 'site', 'features', 'available' ], {} );
}

/**
 * Returns features that are available for current plan.
 * @param  {Object}  state Global state tree
 * @return {Object}  Features
 */
export function getActiveFeatures( state ) {
	return get( state.jetpack.siteData, [ 'data', 'site', 'features', 'active' ], [] );
}

export function getAvailablePlans( state ) {
	return get( state.jetpack.siteData, [ 'data', 'sitePlans' ] );
}
