import { combineReducers } from 'redux';
import {
	JETPACK_INTRO_OFFERS_FETCH,
	JETPACK_INTRO_OFFERS_FETCH_RECEIVE,
	JETPACK_INTRO_OFFERS_FETCH_FAIL,
} from 'state/action-types';

export const data = ( state = [], action ) => {
	switch ( action.type ) {
		case JETPACK_INTRO_OFFERS_FETCH_RECEIVE:
			return action.data;
		default:
			return state;
	}
};

export const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_INTRO_OFFERS_FETCH:
			return { ...state, isFetching: true };
		case JETPACK_INTRO_OFFERS_FETCH_RECEIVE:
		case JETPACK_INTRO_OFFERS_FETCH_FAIL:
			return { ...state, isFetching: false };
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
} );

/**
 * Returns true if currently requesting site intro offers. Otherwise false.
 *
 * @param  {object} state - Global state tree
 * @returns {boolean} Whether intro offers are being requested
 */
export function isFetchingIntroOffers( state ) {
	return !! state.jetpack.introOffers.requests.isFetching;
}

/**
 * Returns intro offers.
 *
 * @param  {object} state - Global state tree
 * @returns {object} Intro offers
 */
export function getIntroOffers( state ) {
	return state.jetpack.introOffers.data;
}
