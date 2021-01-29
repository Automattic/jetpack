/**
 * External dependencies
 */
import { assign, get, merge } from 'lodash';

/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE, MOCK_SWITCH_USER_PERMISSIONS } from 'state/action-types';
import { getPlanDuration } from 'state/plans/reducer';
import { getSiteProducts } from 'state/site-products';
import { isCurrentUserLinked } from 'state/connection';

export const initialState = ( state = window.Initial_State, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, state, action.initialState );

		case MOCK_SWITCH_USER_PERMISSIONS:
			return merge( {}, state, { userData: action.initialState } );

		default:
			return state;
	}
};

/**
 * Returns bool if current version is Dev version
 * Which means -alpha, -beta, etc...
 *
 * @param  {Object}  state  Global state tree
 * @return {bool} true if dev version
 */
export function isDevVersion( state ) {
	return !! state.jetpack.initialState.isDevVersion;
}

/**
 * Returns a string of the current Jetpack version defined
 * by JETPACK__VERSION
 *
 * @param  {Object}  state  Global state tree
 * @return {string}         Version number. Empty string if the data is not yet available.
 */
export function getCurrentVersion( state ) {
	return get( state.jetpack.initialState, 'currentVersion', '' );
}

export function getSiteRoles( state ) {
	return get( state.jetpack.initialState.stats, 'roles', {} );
}

export function getInitialStateStatsData( state ) {
	return get( state.jetpack.initialState.stats, 'data' );
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

export function getSiteTitle( state ) {
	return get( state.jetpack.initialState, 'siteTitle', '' );
}

export function isSitePublic( state ) {
	return get( state.jetpack.initialState, [ 'connectionStatus', 'isPublic' ] );
}

export function isGutenbergAvailable( state ) {
	return get( state.jetpack.initialState, 'is_gutenberg_available', false );
}

export function userIsSubscriber( state ) {
	return ! get( state.jetpack.initialState.userData.currentUser.permissions, 'edit_posts', false );
}

export function userCanPublish( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'publish_posts', false );
}

export function userCanManageModules( state ) {
	return get(
		state.jetpack.initialState.userData.currentUser.permissions,
		'manage_modules',
		false
	);
}

export function userCanManageOptions( state ) {
	return get(
		state.jetpack.initialState.userData.currentUser.permissions,
		'manage_options',
		false
	);
}

/**
 * Return true if user can edit posts, usually admins, editors, authors and contributors.
 *
 * @param {Object} state Global state tree
 *
 * @return {bool} Whether user can edit posts.
 */
export function userCanEditPosts( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'edit_posts', false );
}

/**
 * Return true if user can manage plugins, which means being able to install, activate, update and delete plugins.
 *
 * @param {Object} state Global state tree
 *
 * @return {bool} Whether user can manage plugins.
 */
export function userCanManagePlugins( state ) {
	return get(
		state.jetpack.initialState.userData.currentUser.permissions,
		'manage_plugins',
		false
	);
}

export function userCanDisconnectSite( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'disconnect', false );
}

export function userCanConnectSite( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'connect', false );
}

/**
 * Returns true if current user is connection owner.
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if the current user is connection owner, false otherwise
 *
 * @deprecated 9.3.0
 */
export function userIsMaster( state ) {
	return get( state.jetpack.initialState.userData.currentUser, 'isMaster', false );
}

export function getUserWpComLogin( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'login' ], '' );
}

export function getUserWpComEmail( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'email' ], '' );
}

export function getUserWpComAvatar( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'avatar' ] );
}

export function getUserGravatar( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'gravatar' ] );
}

export function getUsername( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'username' ] );
}

/**
 * Gets the current wp-admin user id
 * @param {Object} state Global state tree
 * @returns {int} The user id in wp-admin
 */
export function getUserId( state ) {
	return get( state.jetpack.initialState.userData.currentUser, 'id', '' );
}

export function userCanViewStats( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'view_stats', false );
}

/**
 * Returns the site icon as an image URL.
 *
 * @param {object} state Global state tree
 *
 * @return {string}        the URL of the icon
 */
export function getSiteIcon( state ) {
	return get( state.jetpack.initialState.siteData, [ 'icon' ] );
}

/**
 * Check whether the site is accessible by search engines or not. It's true by default in an initial WP installation.
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} False if site is set to discourage search engines from indexing it. True otherwise.
 */
export function isSiteVisibleToSearchEngines( state ) {
	return get( state.jetpack.initialState.siteData, [ 'siteVisibleToSearchEngines' ], true );
}

export function getApiNonce( state ) {
	return get( state.jetpack.initialState, 'WP_API_nonce' );
}

export function getApiRootUrl( state ) {
	return get( state.jetpack.initialState, 'WP_API_root' );
}

export function getTracksUserData( state ) {
	return get( state.jetpack.initialState, 'tracksUserData' );
}

export function getCurrentIp( state ) {
	return get( state.jetpack.initialState, 'currentIp' );
}

/**
 * Returns a permalink to the last published entry of 'post' type.
 *
 * @param {Object} state Global state tree
 *
 * @return {String} URL to last published post.
 */
export function getLastPostUrl( state ) {
	return get( state.jetpack.initialState, 'lastPostUrl' );
}

/**
 * Check if promotions like banners are visible or hidden.
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} True if promotions are active, false otherwise.
 */
export function arePromotionsActive( state ) {
	return get( state.jetpack.initialState.siteData, 'showPromotions', true );
}

/**
 * Check if the site is an Automated Transfer site.
 *
 * @param {Object} state   Global state tree.
 *
 * @return {boolean} True if this is an Atomic site, false otherwise.
 */
export function isAtomicSite( state ) {
	return get( state.jetpack.initialState.siteData, 'isAtomicSite', false );
}

/**
 * Check that theme supports a certain feature
 *
 * @param {Object} state   Global state tree.
 * @param {string} feature Feature to check if current theme supports. Can be 'infinite-scroll'.
 *
 * @return {boolean} URL to last published post.
 */
export function currentThemeSupports( state, feature ) {
	return get( state.jetpack.initialState.themeData, [ 'support', feature ], false );
}

/**
 * Check if backups UI should be displayed.
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} True if backups UI should be displayed.
 */
export function showBackups( state ) {
	return get( state.jetpack.initialState.siteData, 'showBackups', true );
}

/**
 * Determines if the Jetpack Recommendations should be displayed
 *
 * @param {object} state - Global state tree
 *
 * @returns {boolean} True if the Jetpack Recommendations should be displayed, false otherwise.
 */
export function showRecommendations( state ) {
	return get( state.jetpack.initialState.siteData, 'showRecommendations', false );
}

/**
 * Check if the Setup Wizard should be displayed
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} True if the Setup Wizard should be displayed.
 */
export function showSetupWizard( state ) {
	return get( state.jetpack.initialState.siteData, 'showSetupWizard', false );
}

/**
 * Check if the site is part of a Multisite network.
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} True if the site is part of a Multisite network.
 */
export function isMultisite( state ) {
	return get( state.jetpack.initialState.siteData, 'isMultisite', false );
}

/**
 * Get the site's date format, in format accepted by DateTimeInterface::format().
 *
 * @param {object} state Global state tree
 *
 * @return {string} Date format of the site.
 */
export function getDateFormat( state ) {
	return get( state.jetpack.initialState.siteData, 'dateFormat', false );
}

/**
 * Returns the affiliate code, if it exists. Otherwise an empty string.
 *
 * @param {object} state Global state tree
 *
 * @return {string} The affiliate code.
 */
export function getAffiliateCode( state ) {
	return get( state.jetpack.initialState, 'aff', '' );
}

/**
 * Returns the partner subsidiary id, if it exists. Otherwise an empty string.
 *
 * @param {object} state Global state tree
 *
 * @return {string} The partner subsidiary id.
 */
export function getPartnerSubsidiaryId( state ) {
	return get( state.jetpack.initialState, 'partnerSubsidiaryId', '' );
}

/**
 * Return an upgrade URL
 *
 * @param {object} state - Global state tree
 * @param {string} source - Context where this URL is clicked.
 * @param {string} userId - Current user id.
 * @param {boolean} planDuration - Add plan duration to the URL.
 *
 * @return {string} Upgrade URL with source, site, and affiliate code added.
 */
export const getUpgradeUrl = ( state, source, userId = '', planDuration = false ) => {
	const affiliateCode = getAffiliateCode( state );
	const subsidiaryId = getPartnerSubsidiaryId( state );
	const uid = userId || getUserId( state );

	if ( planDuration && 'monthly' === getPlanDuration( state ) ) {
		source += '-monthly';
	}

	return (
		'https://jetpack.com/redirect/?' +
		`source=${ source }&site=${ getSiteRawUrl( state ) }` +
		( affiliateCode ? `&aff=${ affiliateCode }` : '' ) +
		( uid ? `&u=${ uid }` : '' ) +
		( subsidiaryId ? `&subsidiaryId=${ subsidiaryId }` : '' ) +
		( isCurrentUserLinked( state ) ? '' : '&unlinked=1' )
	);
};

/**
 * Returns the list of products that are available for purchase.
 *
 * @param state
 * @returns Array of Products that you can purchase.
 */
export function getProductsForPurchase( state ) {
	const products = get( state.jetpack.initialState, 'products', [] );
	const siteProducts = getSiteProducts( state );

	return products.map( product => {
		const optionKey = product.options[ 0 ].key;
		return {
			title: product.title,
			key: product.key,
			shortDescription: product.short_description,
			labelPopup: product.label_popup,
			optionsLabel: product.options_label,
			defaultOption: product.default_option,
			options: getProductOptions( state, product, siteProducts ),
			learnMore: product.learn_more,
			learnMoreUrl: getUpgradeUrl( state, `aag-${ product.key }` ),
			showPromotion: product.show_promotion,
			promotionPercentage: product.discount_percent,
			recordCount: get( siteProducts, [ optionKey, 'price_tier_usage_quantity' ], '0' ),
			priceTierSlug: get( siteProducts, [ optionKey, 'price_tier_slug' ], null ),
			includedInPlans: product.included_in_plans,
		};
	} );
}

function getProductOptions( state, product, siteProducts ) {
	return product.options.map( option => {
		return {
			name: option.name,
			type: option.type,
			key: option.key,
			slug: option.slug,
			description: option.description,
			currencyCode: get( siteProducts, [ option.key, 'currency_code' ], '' ),
			yearly: {
				fullPrice: get( siteProducts, [ option.key, 'cost' ], '' ),
				upgradeUrl: getUpgradeUrl( state, option.slug ),
			},
			monthly: {
				fullPrice: get( siteProducts, [ `${ option.key }_monthly`, 'cost' ], '' ),
				upgradeUrl: getUpgradeUrl( state, `${ option.slug }-monthly` ),
			},
		};
	} );
}

/**
 * The status of the Setup Wizard when the application loaded.
 *
 * @param {*} state Global state tree
 *
 * @return {string} The Setup Wizard status.
 */
export function getInitialSetupWizardStatus( state ) {
	return get( state.jetpack.initialState, 'setupWizardStatus', '' );
}

/**
 * The current step of the Recommendations.
 *
 * @param {*} state - Global state tree.
 *
 * @returns {string} The current Recommendations step.
 */
export function getInitialRecommendationsStep( state ) {
	return get( state.jetpack.initialState, 'recommendationsStep', '' );
}

/**
 * Get the connection errors.
 *
 * @param  {Object} state Global state tree.
 * @returns {Array} Connection errors.
 */
export function getConnectionErrors( state ) {
	return get( state.jetpack.initialState, [ 'connectionStatus', 'errors' ], [] ).filter( error =>
		error.hasOwnProperty( 'action' )
	);
}

/**
 * Check if the user is on Safari browser.
 *
 * @param {Object} state   Global state tree.
 *
 * @return {boolean} True the user is on Safari browser.
 */
export function isSafari( state ) {
	return !! state.jetpack.initialState.isSafari;
}

/**
 * Check if the `JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME` constant is true.
 *
 * @param {Object} state   Global state tree.
 *
 * @return {boolean} True, the `JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME` constant is true.
 */
export function doNotUseConnectionIframe( state ) {
	return !! state.jetpack.initialState.doNotUseConnectionIframe;
}
