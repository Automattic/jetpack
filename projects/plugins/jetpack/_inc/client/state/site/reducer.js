import { __ } from '@wordpress/i18n';
import { merge } from 'lodash';
import { combineReducers } from 'redux';
import {
	getPlanClass,
	isJetpackBackup,
	isJetpackBoost,
	isJetpackProduct,
	isJetpackSearch,
	isJetpackCreator,
	isJetpackGrowth,
	isJetpackSecurityBundle,
	isJetpackAntiSpam,
	isSecurityComparableJetpackLegacyPlan,
	isJetpackSocial,
} from 'lib/plans/constants';
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
			return Object.assign( {}, state, action.siteData );
		case JETPACK_SITE_BENEFITS_FETCH_RECEIVE:
			return merge( {}, state, { site: { benefits: action.siteBenefits } } );
		case JETPACK_SITE_DISCOUNT_FETCH_RECEIVE:
			if ( action.siteDiscount?.code ) {
				return merge( {}, state, { site: { discount: action.siteDiscount } } );
			}
			return state;
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
			return Object.assign( {}, state, {
				isFetchingSiteData: true,
			} );
		case JETPACK_SITE_BENEFITS_FETCH:
			return Object.assign( {}, state, {
				isFetchingSiteBenefits: true,
			} );
		case JETPACK_SITE_DISCOUNT_FETCH:
			return Object.assign( {}, state, {
				isFetchingSiteDiscount: true,
			} );
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH:
			return Object.assign( {}, state, {
				isFetchingConnectedPlugins: true,
			} );
		case JETPACK_SITE_FEATURES_FETCH:
			return Object.assign( {}, state, {
				isFetchingSiteFeatures: true,
			} );
		case JETPACK_SITE_PLANS_FETCH:
			return Object.assign( {}, state, {
				isFetchingSitePlans: true,
			} );
		case JETPACK_SITE_PURCHASES_FETCH:
			return Object.assign( {}, state, {
				isFetchingSitePurchases: true,
			} );
		case JETPACK_SITE_DATA_FETCH_FAIL:
		case JETPACK_SITE_DATA_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				isFetchingSiteData: false,
			} );
		case JETPACK_SITE_BENEFITS_FETCH_FAIL:
		case JETPACK_SITE_BENEFITS_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				isFetchingSiteBenefits: false,
			} );
		case JETPACK_SITE_DISCOUNT_FETCH_FAIL:
		case JETPACK_SITE_DISCOUNT_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				isFetchingSiteDiscount: false,
			} );
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH_FAIL:
		case JETPACK_SITE_CONNECTED_PLUGINS_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				isFetchingConnectedPlugins: false,
				isDoneFetchingConnectedPlugins: true,
			} );
		case JETPACK_SITE_FEATURES_FETCH_FAIL:
		case JETPACK_SITE_FEATURES_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				isFetchingSiteFeatures: false,
			} );
		case JETPACK_SITE_PLANS_FETCH_FAIL:
		case JETPACK_SITE_PLANS_FETCH_RECEIVE:
			return Object.assign( {}, state, {
				isFetchingSitePlans: false,
			} );
		case JETPACK_SITE_PURCHASES_FETCH_FAIL:
		case JETPACK_SITE_PURCHASES_FETCH_RECEIVE:
			return Object.assign( {}, state, {
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

			return Object.assign( {}, state, {
				message: Object.hasOwn( action.error, 'response' )
					? action.error.response.message
					: defaultErrorMessage,
				action: resolveAction,
				code: Object.hasOwn( action.error, 'response' )
					? action.error.response.code
					: 'fetch_site_data_fail_other',
				data: Object.hasOwn( action.error, 'response' ) ? action.error.response.data : {},
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
 * @param {object} state - Global state tree
 * @return {object}        Error object
 */
export function getSiteDataErrors( state ) {
	return [ state.jetpack.siteData?.errors ?? [] ];
}

/**
 * Returns true if currently requesting site data. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean}       Whether site data is being requested
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
 * @param {object} state - Global state tree
 * @return {boolean}       Whether benefits are being requested
 */
export function isFetchingSiteBenefits( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSiteBenefits;
}

/**
 * Returns true if currently requesting site discount. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean}        Whether discount is being requested
 */
export function isFetchingSiteDiscount( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSiteDiscount;
}

/**
 * Returns true if currently requesting connected plugins. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean}       Whether connected plugins are being requested
 */
export function isFetchingConnectedPlugins( state ) {
	return !! state.jetpack.siteData.requests.isFetchingConnectedPlugins;
}

/**
 * Returns true if the connected plugins request has finished (even if it returned an error). Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean}       Whether connected plugins request is completed.
 */
export function isDoneFetchingConnectedPlugins( state ) {
	return !! state.jetpack.siteData.requests.isDoneFetchingConnectedPlugins;
}

/**
 * Returns true if currently requesting site purchases. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @return {boolean}       Whether site purchases are being requested
 */
export function isFetchingSitePurchases( state ) {
	return !! state.jetpack.siteData.requests.isFetchingSitePurchases;
}

/**
 * Returns the products of this site.
 *
 * @param {object} state - Global state tree
 * @return {Array}          Site products
 */
export function getSiteProducts( state ) {
	return state.jetpack.siteData?.data?.products ?? [];
}

/**
 * Returns the plan of this site.
 *
 * @param {object} state - Global state tree
 * @return {object}        Site plan
 */
export function getSitePlan( state ) {
	return state.jetpack.siteData?.data?.plan ?? {};
}

/**
 * Returns the VideoPress storage used for this site.
 *
 * @param {object} state - Argv object for an install command. Must contain project and root at least.
 * @return {number|null}  Storage used in megabytes or null if not found.
 */
export function getVideoPressStorageUsed( state ) {
	return state.jetpack.siteData?.data?.options?.videopress_storage_used ?? null;
}

/**
 * Returns benefits provided to the site by Jetpack.
 *
 * @param {object} state - Global state tree
 * @return {object}        Benefits
 */
export function getSiteBenefits( state ) {
	return state.jetpack.siteData?.data?.site?.benefits ?? null;
}

/**
 * Returns discount provided to the site by Jetpack.
 *
 * @param {object} state - Global state tree
 * @return {object} Discount
 */
export function getSiteDiscount( state ) {
	return state.jetpack.siteData?.data?.site?.discount ?? {};
}

/**
 * Returns features that are available on any plan.
 *
 * @param {object} state - Global state tree
 * @return {object}        Features
 */
export function getAvailableFeatures( state ) {
	return state.jetpack.siteData?.data?.site?.features?.available ?? {};
}

/**
 * Returns features that are available for current plan.
 *
 * @param {object} state - Global state tree
 * @return {object}        Features
 */
export function getActiveFeatures( state ) {
	return state.jetpack.siteData?.data?.site?.features?.active ?? [];
}

/**
 * Check if the feature is active on the site.
 *
 * @param {object} state     - Global state tree
 * @param {string} featureId - The feature to check.
 * @return {boolean}            True if the feature is active. Otherwise, False.
 */
export function siteHasFeature( state, featureId ) {
	const siteFeatures = getActiveFeatures( state );

	return siteFeatures && siteFeatures.indexOf( featureId ) >= 0;
}

/**
 * Check if the site's admin interface style is set to wp-admin.
 *
 * @param {object} state - Global state tree
 * @return {boolean}            Whether the admin interface style is set to wp-admin.
 */
export function siteUsesWpAdminInterface( state ) {
	return state.jetpack.siteData?.data?.options?.wpcom_admin_interface === 'wp-admin';
}

/**
 * Returns the purchase data for a site
 *
 * @param {object} state - Global state tree
 * @return {Array}        Purchases for the site
 */
export function getSitePurchases( state ) {
	return state.jetpack.siteData?.data?.sitePurchases ?? [];
}

/**
 * Returns the active purchases for a site
 *
 * @param {object} state - Global state tree
 * @return {Array}        Active purchases for the site
 */
export function getActiveSitePurchases( state ) {
	return getSitePurchases( state ).filter( purchase => 'active' === purchase.subscription_status );
}

/**
 * Returns the active product purchases for a site
 *
 * @param {object} state - Global state tree
 * @return {Array}        Active product purchases for the site
 */
export function getActiveProductPurchases( state ) {
	return getActiveSitePurchases( state ).filter( purchase =>
		isJetpackProduct( purchase.product_slug )
	);
}

/**
 * Determines if the site has an active product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active product purchase, false otherwise.
 */
export function hasActiveProductPurchase( state ) {
	return getActiveProductPurchases( state ).length > 0;
}

/**
 * Return any active security bundles on the site
 *
 * @param {object} state - Global state tree
 * @return {object}       A active security bundle on the site, undefined otherwise
 */
export function getActiveSecurityPurchase( state ) {
	return getActiveSitePurchases( state ).find( purchase =>
		isJetpackSecurityBundle( purchase.product_slug )
	);
}

/**
 * Determines if the site has an active security or complete plan
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active security or complete plan, false otherwise.
 */
export function hasActiveSecurityPurchase( state ) {
	return !! getActiveSecurityPurchase( state ) || hasActiveCompletePurchase( state );
}

/**
 * Determines if the site has an active Jetpack Complete plan
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active Jetpack Complete plan, false otherwise.
 */
export function hasActiveCompletePurchase( state ) {
	return 'is-complete-plan' === getPlanClass( getSitePlan( state ).product_slug );
}

/**
 * Searches active products for Search product
 *
 * @param {object} state - Global state tree
 * @return {object}       An active Search product if one was found, undefined otherwise.
 */
export function getActiveSearchPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackSearch( product.product_slug )
	);
}

/**
 * Determines if the site has an active Search product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active Search product purchase, false otherwise.
 */
export function hasActiveSearchPurchase( state ) {
	return !! getActiveSearchPurchase( state ) || hasActiveCompletePurchase( state );
}

/**
 * Searches active products for Creator product
 *
 * @param {object} state - Global state tree
 * @return {object}       An active Creator product if one was found, undefined otherwise.
 */
export function getActiveCreatorPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackCreator( product.product_slug )
	);
}

/**
 * Searches active products for Growth product
 *
 * @param {object} state - Global state tree
 * @return {object}       An active Growth product if one was found, undefined otherwise.
 */
export function getActiveGrowthPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackGrowth( product.product_slug )
	);
}

/**
 * Determines if the site has an active Creator product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active Creator product purchase, false otherwise.
 */
export function hasActiveCreatorPurchase( state ) {
	return !! getActiveCreatorPurchase( state ) || hasActiveCompletePurchase( state );
}

/**
 * Determines if the site has an active Growth product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active Growth product purchase, false otherwise.
 */
export function hasActiveGrowthPurchase( state ) {
	return !! getActiveGrowthPurchase( state ) || hasActiveCompletePurchase( state );
}

/**
 * Searches active products for an active Anti-Spam product.
 *
 * @param {object} state - Global state tree
 * @return {object}       An active Anti-Spam product if one was found, undefined otherwise.
 */
export function getActiveAntiSpamPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackAntiSpam( product.product_slug )
	);
}

/**
 * Determines if the site has an active Anti-Spam product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active Anti-Spam product purchase, false otherwise.
 */
export function hasActiveAntiSpamPurchase( state ) {
	return !! getActiveAntiSpamPurchase( state );
}

/**
 * Searches active products for an active Boost product.
 *
 * @param {object} state - Global state tree
 * @return {object}       An active Boost product if one was found, undefined otherwise.
 */
export function getActiveBoostPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackBoost( product.product_slug )
	);
}

/**
 * Determines if the site has an active Boost product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active Boost product purchase, false otherwise.
 */
export function hasActiveBoostPurchase( state ) {
	return !! getActiveBoostPurchase( state ) || hasActiveCompletePurchase( state );
}

/**
 * Searches active products for an active Backup product.
 *
 * @param {object} state - Global state tree
 * @return {object}       An active backup product if one was found, undefined otherwise.
 */
export function getActiveBackupPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackBackup( product.product_slug )
	);
}

/**
 * Determines if the site has an active social product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active backup product purchase, false otherwise.
 */
export function getActiveSocialPurchase( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isJetpackSocial( product.product_slug )
	);
}

/**
 * Determines if the site has an active backup product purchase
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has an active backup product purchase, false otherwise.
 */
export function hasActiveBackupPurchase( state ) {
	return !! getActiveBackupPurchase( state );
}

/**
 * Searches active products for an active Social product.
 *
 * @param {object} state - Global state tree
 * @return {object}       An active Social product if one was found, undefined otherwise.
 */
export function hasActiveSocialPurchase( state ) {
	return !! getActiveSocialPurchase( state );
}

/**
 * Searches active products for a legacy Jetpack plan with security features.
 *
 * @param {object} state - Global state tree
 * @return {object}       An active legacy plan with security features if one was found, undefined otherwise.
 */
export function getSecurityComparableLegacyPlan( state ) {
	return getActiveProductPurchases( state ).find( product =>
		isSecurityComparableJetpackLegacyPlan( product.product_slug )
	);
}

/**
 * Determines if the site has an active Jetpack legacy plan with security features
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True if the site has a legacy Jetpack plan with security features, false otherwise.
 */
export function hasSecurityComparableLegacyPlan( state ) {
	return !! getSecurityComparableLegacyPlan( state );
}

/**
 * Returns the site ID
 *
 * @param {object} state - Global state tree
 * @return {number}        Site ID
 */
export function getSiteID( state ) {
	return state.jetpack.siteData?.data?.ID;
}

/**
 * Returns plugins that use the Jetpack connection
 *
 * @param {object} state - Global state tree
 * @return {object}        Connected plugins
 */
export function getConnectedPlugins( state ) {
	if ( ! isDoneFetchingConnectedPlugins( state ) ) {
		return null;
	}

	const plugins = state.jetpack.siteData?.data?.site?.connectedPlugins ?? [];
	return plugins.filter( plugin => 'jetpack' !== plugin.slug );
}

/**
 * Returns Jetpack connected plugins converted to obj keyed by slug
 * [ { name, slug }, ... ] -> { slug: { name }, ... }
 *
 * @param {object} state - Global state tree
 * @return {object}         Connected plugins
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
