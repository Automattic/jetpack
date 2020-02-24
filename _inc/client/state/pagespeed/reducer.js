/**
 * External dependencies
 */
// import { combineReducers } from 'redux';
import { assign, get } from 'lodash';

/**
 * Internal dependencies
 */
import {
	JETPACK_GET_PAGESPEED_INSIGHTS,
	JETPACK_GET_PAGESPEED_INSIGHTS_SUCCESS,
	JETPACK_GET_PAGESPEED_INSIGHTS_FAIL,
} from 'state/action-types';

export const pagespeed = (
	state = { fetchingPagespeedInsights: false, url: null, response: null, error: null },
	action
) => {
	switch ( action.type ) {
		case JETPACK_GET_PAGESPEED_INSIGHTS:
			return assign( {}, state, {
				fetchingPagespeedInsights: true,
				url: action.url,
			} );
		case JETPACK_GET_PAGESPEED_INSIGHTS_SUCCESS:
			return assign( {}, state, {
				fetchingPagespeedInsights: false,
				response: action.response,
				error: null,
			} );
		case JETPACK_GET_PAGESPEED_INSIGHTS_FAIL:
			return assign( {}, state, {
				fetchingPagespeedInsights: false,
				response: null,
				error: action.error,
			} );
		default:
			return state;
	}
};

export const reducer = pagespeed;

/**
 * Returns true if currently trying to send a login email
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether email is being sent
 */
export function isFetchingPagespeedInsights( state ) {
	return get( state, 'jetpack.pagespeed.fetchingPagespeedInsights', false );
}

/**
 * Returns an error object for the last magic login link or null.
 *
 * @param {Object}  state Global state tree.
 * @return {Object|null}  The error object if there is one.
 */
export function getMobileLoginEmailError( state ) {
	return get( state, 'jetpack.pagespeed.error', null );
}

export function getPagespeedInsightsResults( state ) {
	return get( state, 'jetpack.pagespeed.response', null );
}
