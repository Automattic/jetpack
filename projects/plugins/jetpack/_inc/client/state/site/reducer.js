import { __ } from '@wordpress/i18n';
import {
	getPlanClass,
	isJetpackBackup,
	isJetpackProduct,
	isJetpackSearch,
	isJetpackSecurityBundle,
	isJetpackAntiSpam,
	isSecurityComparableJetpackLegacyPlan,
} from 'lib/plans/constants';
import { assign, find, get, merge } from 'lodash';
import { combineReducers } from 'redux';
import {
	JETPACK_SITE_DATA_FETCH,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	JETPACK_SITE_DATA_FETCH_FAIL,
	JETPACK_SITE_BENEFITS_FETCH,
	JETPACK_SITE_BENEFITS_FETCH_RECEIVE,
	JETPACK_SITE_BENEFITS_FETCH_FAIL,
	JETPACK_SITE_DISCOUNT_FETCH,
	JETPACK_SITE_DISCOUNT_FETCH_RECEIVE,
	JETPACK_SITE_DISCOUNT_FETCH_FAIL,
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
		case JETPACK_SITE_DISCOUNT_FETCH_RECEIVE:
			if ( action.siteDiscount?.code ) {
				return merge( {}, state, { site: { discount: action.siteDiscount } } );
			}
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
		case JETPACK_SITE_DISCOUNT_FETCH:
			return assign( {}, state, {
				isFetchingSiteDiscount: true,
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
		case JETPACK_SITE_DISCOUNT_FETCH_FAIL:
		case JETPACK_SITE_DISCOUNT_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingSiteDiscount: false,
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
	let resolveAction, defaultErrorMessage;

	switch ( action.type ) {
		case JETPACK_SITE_DATA_FETCH_FAIL:
			switch ( action.error.name ) {
				case 'ApiError':
					// We display the error using `ErrorNoticeCycleConnection` component, proving an easy way to reconnect.
					resolveAction = 'reconnect';
					defaultErrorMessage = __(
						'There seems to be a problem with your connection to WordPress.com. If the problem persists, try reconnecting.',
						'jetpack'
					);
					break;
				case 'JsonParseError':
					// We offer a link to support to help them fix the issue.
					resolveAction = 'support';
					defaultErrorMessage = __(
						'Jetpack encountered an error and was unable to display the Dashboard. Please try refreshing the page.',
						'jetpack'
					);
					break;
				default:
					// Unknown error, we don't know how to fix that yet. It's highly unlikely reconnecting would help, so we do nothing.
					resolveAction = null;
					defaultErrorMessage = __( 'There seems to be a problem with your website.', 'jetpack' );
					break;
			}

			return assign( {}, state, {
				message: action.error.hasOwnProperty( 'response' )
					? action.error.response.message
					: defaultErrorMessage,
				action: resolveAction,
				code: action.error.hasOwnProperty( 'response' )
					? action.error.response.code
					: 'fetch_site_data_fail_other',
				data: action.error.hasOwnProperty( 'response' ) ? action.error.response.data : {},
			} );
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
 * Returns an object of the siteData errors
 *
 * @param  {Object}  state Global state tree
 * @return {Object}        Error object
 */
export function getSiteDataErrors( state ) {
	return [ get( state.jetpack.siteData, [ 'errors' ], [] ) ];
}

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
 * Returns true if currently requesting site benefits. Otherwise false.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether benefits are being requested
 */
export function isFetchingSiteBenefits( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSiteBenefits;
}

/**
 * Returns true if currently requesting site discount. Otherwise false.
 *
 * @param  {object}  state - Global state tree
 * @returns {boolean} Whether discount is being requested
 */
export function isFetchingSiteDiscount( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSiteDiscount;
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
 * Returns the products of this site.
 *
 * @param   {object} state - Global state tree
 * @returns {Array} Site products
 */
export function getSiteProducts( state ) {
	return get( state.jetpack.siteData, [ 'data', 'products' ], [] );
}

/**
 * Returns the plan of this site.
 * @param  {Object}  state Global state tree
 * @return {Object}  Site plan
 */
export function getSitePlan( state ) {
	return get( state.jetpack.siteData, [ 'data', 'plan' ], {} );
}

/**
 * Returns the VideoPress storage used for this site.
 *
 * @param {object} state - Argv object for an install command. Must contain project and root at least.
 * @returns {number|null} - Storage used in megabytes or null if not found.
 */
export function getVideoPressStorageUsed( state ) {
	return get( state.jetpack.siteData, [ 'data', 'options', 'videopress_storage_used' ], null );
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
 * Returns discount provided to the site by Jetpack.
 *
 * @param  {object} state - Global state tree
 * @returns {object} Discount
 */
export function getSiteDiscount( state ) {
	return get( state.jetpack.siteData, [ 'data', 'site', 'discount' ], {} );
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

/**
 * Check if the feature is active on the site.
 *
 * @param  {object}  state     - Global state tree
 * @param  {string}  featureId - The feature to check.
 * @returns {boolean} True if the feature is active. Otherwise, False.
 */
export function siteHasFeature( state, featureId ) {
	const siteFeatures = getActiveFeatures( state );

	return siteFeatures && siteFeatures.indexOf( featureId ) >= 0;
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

/**
 * Determines if the site has an active product purchase
 *
 * @param {*} state - Global state tree
 * @returns {boolean} True if the site has an active product purchase, false otherwise.
 */
export function hasActiveProductPurchase( state ) {
	return getActiveProductPurchases( state ).length > 0;
}

/**
 * Return any active security bundles on the site
 *
 * @param {*} state - Global state tree
 * @returns {object} A active security bundle on the site, undefined otherwise
 */
export function getActiveSecurityPurchase( state ) {
	return find( getActiveSitePurchases( state ), purchase =>
		isJetpackSecurityBundle( purchase.product_slug )
	);
}

/**
 * Determines if the site has an active security or complete plan
 *
 * @param {*} state - Global state tree
 * @returns {boolean} True if the site has an active security or complete plan, false otherwise.
 */
export function hasActiveSecurityPurchase( state ) {
	return (
		!! getActiveSecurityPurchase( state ) ||
		'is-complete-plan' === getPlanClass( getSitePlan( state ).product_slug )
	);
}

export function getActiveSearchPurchase( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isJetpackSearch( product.product_slug )
	);
}

export function hasActiveSearchPurchase( state ) {
	return (
		!! getActiveSearchPurchase( state ) ||
		'is-complete-plan' === getPlanClass( getSitePlan( state ).product_slug )
	);
}

/**
 * Searches active products for an active Anti-Spam product.
 *
 * @param {*} state - Global state tree
 * @returns {object} An active Anti-Spam product if one was found, undefined otherwise.
 */
export function getActiveAntiSpamPurchase( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isJetpackAntiSpam( product.product_slug )
	);
}

/**
 * Determines if the site has an active Anti-Spam product purchase
 *
 * @param {*} state - Global state tree
 * @returns {boolean} True if the site has an active Anti-Spam product purchase, false otherwise.
 */
export function hasActiveAntiSpamPurchase( state ) {
	return !! getActiveAntiSpamPurchase( state );
}

/**
 * Searches active products for an active Backup product.
 *
 * @param {*} state - Global state tree
 * @returns {object} An active backup product if one was found, undefined otherwise.
 */
export function getActiveBackupPurchase( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isJetpackBackup( product.product_slug )
	);
}

/**
 * Determines if the site has an active backup product purchase
 *
 * @param {*} state - Global state tree
 * @returns {boolean} True if the site has an active backup product purchase, false otherwise.
 */
export function hasActiveBackupPurchase( state ) {
	return !! getActiveBackupPurchase( state );
}

/**
 * Searches active products for a legacy Jetpack plan with security features.
 *
 * @param {*} state - Global state tree
 * @returns {object} An active legacy plan with security features if one was found, undefined otherwise.
 */
export function getSecurityComparableLegacyPlan( state ) {
	return find( getActiveProductPurchases( state ), product =>
		isSecurityComparableJetpackLegacyPlan( product.product_slug )
	);
}

/**
 * Determines if the site has an active Jetpack legacy plan with security features
 *
 * @param {*} state - Global state tree
 * @returns {boolean} True if the site has a legacy Jetpack plan with security features, false otherwise.
 */
export function hasSecurityComparableLegacyPlan( state ) {
	return !! getSecurityComparableLegacyPlan( state );
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

/**
 * Returns Jetpack connected plugins converted to obj keyed by slug
 * [ { name, slug }, ... ] -> { slug: { name }, ... }
 *
 * @param   {object} state - Global state tree
 * @returns {object} Connected plugins
 */
export function getConnectedPluginsMap( state ) {
	const plugins = getConnectedPlugins( state );

	return (
		plugins &&
		plugins.reduce( ( map, plugin ) => {
			map[ plugin.slug ] = { name: plugin.name };
			return map;
		}, {} )
	);
}
