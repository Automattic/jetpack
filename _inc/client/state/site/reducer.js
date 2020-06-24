/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, find, get, merge } from 'lodash';

/**
 * Internal dependencies
 */
import {
	isJetpackProduct,
	isJetpackBackup,
	isJetpackScan,
	isJetpackSearch,
} from 'lib/plans/constants';
import {
	JETPACK_SITE_DATA_FETCH,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	JETPACK_SITE_DATA_FETCH_FAIL,
	JETPACK_SITE_BENEFITS_FETCH,
	JETPACK_SITE_BENEFITS_FETCH_RECEIVE,
	JETPACK_SITE_BENEFITS_FETCH_FAIL,
	JETPACK_SITE_FEATURES_FETCH,
	JETPACK_SITE_FEATURES_FETCH_RECEIVE,
	JETPACK_SITE_FEATURES_FETCH_FAIL,
	JETPACK_SITE_PLANS_FETCH,
	JETPACK_SITE_PLANS_FETCH_RECEIVE,
	JETPACK_SITE_PLANS_FETCH_FAIL,
	JETPACK_SITE_PURCHASES_FETCH,
	JETPACK_SITE_PURCHASES_FETCH_RECEIVE,
	JETPACK_SITE_PURCHASES_FETCH_FAIL,
	JETPACK_SITE_CONNECTED_PLUGINS_FETCH,
	JETPACK_SITE_CONNECTED_PLUGINS_FETCH_RECEIVE,
	JETPACK_SITE_CONNECTED_PLUGINS_FETCH_FAIL,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return assign( {}, state, action.siteData );
		case JETPACK_SITE_BENEFITS_FETCH_RECEIVE:
			return merge( {}, state, { site: { benefits: action.siteBenefits } } );
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH_RECEIVE:
			return merge( {}, state, { site: { connectedPlugins: action.connectedPlugins } } );
		case JETPACK_SITE_FEATURES_FETCH_RECEIVE:
			return merge( {}, state, { site: { features: action.siteFeatures } } );
		case JETPACK_SITE_PLANS_FETCH_RECEIVE:
			return merge( {}, state, { sitePlans: action.plans } );
		case JETPACK_SITE_PURCHASES_FETCH_RECEIVE:
			return merge( {}, state, { sitePurchases: action.purchases } );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingSiteData: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH:
			return assign( {}, state, {
				isFetchingSiteData: true,
			} );
		case JETPACK_SITE_BENEFITS_FETCH:
			return assign( {}, state, {
				isFetchingSiteBenefits: true,
			} );
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH:
			return assign( {}, state, {
				isFetchingConnectedPlugins: true,
			} );
		case JETPACK_SITE_FEATURES_FETCH:
			return assign( {}, state, {
				isFetchingSiteFeatures: true,
			} );
		case JETPACK_SITE_PLANS_FETCH:
			return assign( {}, state, {
				isFetchingSitePlans: true,
			} );
		case JETPACK_SITE_PURCHASES_FETCH:
			return assign( {}, state, {
				isFetchingSitePurchases: true,
			} );
		case JETPACK_SITE_DATA_FETCH_FAIL:
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteData: false,
			} );
		case JETPACK_SITE_BENEFITS_FETCH_FAIL:
		case JETPACK_SITE_BENEFITS_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteBenefits: false,
			} );
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH_FAIL:
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingConnectedPlugins: false,
				isDoneFetchingConnectedPlugins: true,
			} );
		case JETPACK_SITE_FEATURES_FETCH_FAIL:
		case JETPACK_SITE_FEATURES_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteFeatures: false,
			} );
		case JETPACK_SITE_PLANS_FETCH_FAIL:
		case JETPACK_SITE_PLANS_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSitePlans: false,
			} );
		case JETPACK_SITE_PURCHASES_FETCH_FAIL:
		case JETPACK_SITE_PURCHASES_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSitePurchases: false,
			} );

		default:
			return state;
	}
};

export const errors = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH_FAIL:
			return assign( {}, state, action.error );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
	errors,
} );

/**
 * Returns true if currently requesting site data. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether site data is being requested
 */
export function isFetchingSiteData( state ) {
	return !! (
		state.jetpack.siteData.requests.isFetchingSiteData ||
		state.jetpack.siteData.requests.isFetchingSiteFeatures ||
		state.jetpack.siteData.requests.isFetchingSitePlans ||
		state.jetpack.siteData.requests.isFetchingSitePurchases
	);
}

/**
 * Returns an object of the siteData errors
 *
 * @param  {Object}  state Global state tree
 * @return {Object}        Error object
 */
export function getSiteDataErrors( state ) {
	return get( state.jetpack.siteData, [ 'errors' ], {} );
}

/**
 * Returns true if currently requesting site benefits. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether benefits are being requested
 */
export function isFetchingSiteBenefits( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSiteBenefits;
}

/**
 * Returns true if currently requesting connected plugins. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether connected plugins are being requested
 */
export function isFetchingConnectedPlugins( state ) {
	return !! state.jetpack.siteData.requests.isFetchingConnectedPlugins;
}

/**
 * Returns true if the connected plugins request has finished (even if it returned an error). Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether connected plugins request is completed.
 */
export function isDoneFetchingConnectedPlugins( state ) {
	return !! state.jetpack.siteData.requests.isDoneFetchingConnectedPlugins;
}

/**
 * Returns true if currently requesting site purchases. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether site purchases are being requested
 */
export function isFetchingSitePurchases( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSitePurchases;
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
 * Returns benefits provided to the site by Jetpack.
 * @param  {Object}  state Global state tree
 * @return {Object}  Benefits
 */
export function getSiteBenefits( state ) {
	return get( state.jetpack.siteData, [ 'data', 'site', 'benefits' ], null );
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

export function getSitePurchases( state ) {
	return get( state.jetpack.siteData, [ 'data', 'sitePurchases' ], [] );
}

/**
 * Returns the active purchases for a site
 * @param {*} state Global state tree
 * @return {Array}  Active purchases for the site
 */
export function getActiveSitePurchases( state ) {
	return getSitePurchases( state ).filter( purchase => '1' === purchase.active );
}

export function getActiveProductPurchases( state ) {
	return getActiveSitePurchases( state ).filter( purchase =>
		isJetpackProduct( purchase.product_slug )
	);
}

export function getActiveBackupPurchase( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isJetpackBackup( product.product_slug )
	);
}

export function hasActiveBackupPurchase( state ) {
	return !! getActiveBackupPurchase( state );
}

export function getActiveScanPurchase( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isJetpackScan( product.product_slug )
	);
}

export function hasActiveScanPurchase( state ) {
	return !! getActiveScanPurchase( state );
}

export function getActiveSearchPurchase( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isJetpackSearch( product.product_slug )
	);
}

export function hasActiveSearchPurchase( state ) {
	return !! getActiveSearchPurchase( state );
}

export function getSiteID( state ) {
	return get( state.jetpack.siteData, [ 'data', 'ID' ] );
}

/**
 * Returns plugins that use the Jetpack connection
 *
 * @param  {Object} state Global state tree
 * @return {Object}        Connected plugins
 */
export function getConnectedPlugins( state ) {
	if ( ! isDoneFetchingConnectedPlugins( state ) ) {
		return null;
	}

	const plugins = get( state.jetpack.siteData, [ 'data', 'site', 'connectedPlugins' ], [] );
	return plugins.filter( plugin => 'jetpack' !== plugin.slug );
}
