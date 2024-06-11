import { getRedirectUrl } from '@automattic/jetpack-components';
import { assign, get, merge } from 'lodash';
import { JETPACK_SET_INITIAL_STATE, MOCK_SWITCH_USER_PERMISSIONS } from 'state/action-types';
import { isCurrentUserLinked } from 'state/connection';
import { getPlanDuration } from 'state/plans/reducer';
import { getSiteProducts } from 'state/site-products';

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

/**
 * Returns an object of plugins that are using the Jetpack connection.
 *
 * @param   {object}  state - Global state tree
 * @returns {object}         Plugins that are using the Jetpack connection.
 */
export function getInitialStateConnectedPlugins( state ) {
	return get( state.jetpack.initialState, 'connectedPlugins', {} );
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
 * Returns true if current user can connect their WordPress.com account.
 *
 * @param {object} state - Global state tree
 *
 * @returns {boolean} Whether current user can connect their WordPress.com account.
 */
export function userCanConnectAccount( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'connect_user', false );
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

/**
 * Returns the WPCOM ID of the connected user.
 *
 * @param {object} state - Global state tree
 * @returns {number}        the ID of the user
 */
export function getUserWpComId( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'ID' ], '' );
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
 * Returns the WPCOM ID of a connected site.
 *
 * @param {object} state - Global state tree
 * @returns {number}        the ID of the site
 */
export function getSiteId( state ) {
	return get( state.jetpack.initialState.siteData, [ 'blog_id' ] );
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

/**
 * Returns the site's boost speed scores from the last time it was checked
 *
 * @param {object} state - Global state tree
 * @returns {object}        the boost speed scores and timestamp
 */
export function getLatestBoostSpeedScores( state ) {
	return get( state.jetpack.initialState.siteData, [ 'latestBoostSpeedScores' ] );
}

export function getApiNonce( state ) {
	return get( state.jetpack.initialState, 'WP_API_nonce' );
}

export function getApiRootUrl( state ) {
	return get( state.jetpack.initialState, 'WP_API_root' );
}

/**
 * Returns the registration nonce.
 *
 * @param {object} state - Global state tree
 * @returns {string} The registration nonce
 */
export function getRegistrationNonce( state ) {
	return get( state.jetpack.initialState, 'registrationNonce' );
}

/**
 * Returns the plugin base URL.
 *
 * @param {object} state - Global state tree
 * @returns {string} The registration nonce
 */
export function getPluginBaseUrl( state ) {
	return get( state.jetpack.initialState, 'pluginBaseUrl' );
}

/**
 * Returns a purchase token that is used for Jetpack logged out visitor checkout.
 *
 * @param {object} state - Global state tree
 *
 * @returns {string|boolean} purchase token or false if not the connection owner.
 */
export function getPurchaseToken( state ) {
	return get( state.jetpack.initialState, 'purchaseToken' );
}

/**
 * Returns current Calypso environment.
 *
 * @param {object} state - Global state tree
 *
 * @returns {string} Calypso environment name.
 */
export function getCalypsoEnv( state ) {
	return get( state.jetpack.initialState, 'calypsoEnv' );
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
 * @todo Deprecated soon for isWoASite();
 * @param {object} state - Global state tree.
 *
 * @returns {boolean} True if this is an WoA site, false otherwise.
 */
export function isAtomicSite( state ) {
	return get( state.jetpack.initialState.siteData, 'isAtomicSite', false );
}

/**
 * Check if the site is a WordPress.com-on-Atomic site.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if this is an WoA site, false otherwise.
 */
export function isWoASite( state ) {
	return get( state.jetpack.initialState.siteData, 'isWoASite', false );
}

/**
 * Check if the site is an Atomic-hosted site.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if this is an Atomic-hosted site, false otherwise.
 */
export function isAtomicPlatform( state ) {
	return get( state.jetpack.initialState.siteData, 'isAtomicPlatform', false );
}

/**
 * Get the current theme's stylesheet (slug).
 *
 * @param {object} state - Global state tree.
 * @returns {string} theme stylesheet, e.g. twentytwentythree.
 */
export function currentThemeStylesheet( state ) {
	return get( state.jetpack.initialState.themeData, 'stylesheet' );
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
 * Check that the current theme is a block theme.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if the current theme is a block theme, false otherwise.
 */
export function currentThemeIsBlockTheme( state ) {
	return get( state.jetpack.initialState.themeData, [ 'isBlockTheme' ], false );
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
 * Determines if My Jetpack should be referenced.
 *
 * @param {object} state - Global state tree
 * @returns {boolean} True if the My Jetpack should be referenced, false otherwise.
 */
export function showMyJetpack( state ) {
	return get( state.jetpack.initialState.siteData, 'showMyJetpack', true );
}

/**
 * Get an array of new recommendations for this site
 *
 * @param {object} state - Global state tree
 * @returns {Array} - Array of recommendation slugs
 */
export function getNewRecommendations( state ) {
	return get( state.jetpack.initialState, 'newRecommendations', [] );
}

/**
 * Get a count of new recommendations for this site
 *
 * @param {object} state - Global state tree
 * @returns {number} - Count of recommendations
 */
export function getNewRecommendationsCount( state ) {
	return getNewRecommendations( state ).length;
}

/**
 * Determines if the Jetpack Licensing UI should be displayed
 *
 * @param {object} state - Global state tree
 *
 * @returns {boolean} True if the Jetpack Licensing UI should be displayed, false otherwise.
 */
export function showLicensingUi( state ) {
	return get( state.jetpack.initialState.licensing, 'showLicensingUi', false );
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
 * Returns the partner coupon associated with this site, if any.
 *
 * @param {object} state - Global state tree
 * @returns {object|boolean} partner coupon if exists or false.
 */
export function getPartnerCoupon( state ) {
	return get( state.jetpack.initialState, 'partnerCoupon' );
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
	const purchaseToken = getPurchaseToken( state );
	const calypsoEnv = getCalypsoEnv( state );
	const blogID = getSiteId( state );

	if ( planDuration && 'monthly' === getPlanDuration( state ) ) {
		source += '-monthly';
	}

	const redirectArgs = {
		site: blogID ?? getSiteRawUrl( state ),
	};

	if ( affiliateCode ) {
		redirectArgs.aff = affiliateCode;
	}
	if ( uid ) {
		redirectArgs.u = uid;
	}
	if ( subsidiaryId ) {
		redirectArgs.subsidiaryId = subsidiaryId;
	}

	redirectArgs.query = '';

	if ( ! isCurrentUserLinked( state ) ) {
		redirectArgs.query += 'unlinked=1&';
	}
	if ( purchaseToken ) {
		redirectArgs.query += `purchasetoken=${ purchaseToken }`;
	}
	if ( calypsoEnv ) {
		redirectArgs.calypso_env = calypsoEnv;
	}

	return getRedirectUrl( source, redirectArgs );
};

/**
 * Returns the list of products that are available for purchase in the initial state.
 *
 * @param {object} state - Global state tree
 * @returns {Array} - Array of Products that you can purchase.
 */
export function getStaticProductsForPurchase( state ) {
	return get( state.jetpack.initialState, 'products', {} );
}

/**
 * Returns the list of products that are available for purchase.
 *
 * @param state
 * @returns Array of Products that you can purchase.
 */
export function getProductsForPurchase( state ) {
	const staticProducts = get( state.jetpack.initialState, 'products', {} );
	const jetpackProducts = getSiteProducts( state );
	const products = {};

	for ( const [ key, product ] of Object.entries( staticProducts ) ) {
		products[ key ] = {
			title: product.title,
			slug: product.slug,
			key: key,
			description: product.description,
			features: product.features,
			disclaimer: product.disclaimer,
			available: get( jetpackProducts, [ product.slug, 'available' ], false ),
			currencyCode: get( jetpackProducts, [ product.slug, 'currency_code' ], '' ),
			showPromotion: product.show_promotion,
			promotionPercentage: product.discount_percent,
			includedInPlans: product.included_in_plans,
			fullPrice: get( jetpackProducts, [ product.slug, 'cost' ], '' ),
			saleCoupon: get( jetpackProducts, [ product.slug, 'sale_coupon' ], undefined ),
			upgradeUrl: getRedirectUrl( 'jetpack-product-description-checkout', {
				path: product.slug,
			} ),
		};
	}

	return products;
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

/**
 * Check if WooCommerce is currently installed and active
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True, the plugin is installed and active
 */
export function isWooCommerceActive( state ) {
	return !! state.jetpack.initialState.isWooCommerceActive;
}

/**
 * Returns the Jetpack Cloud URL for the specified resource for the current site.
 *
 * @param {object} state - Global state tree.
 * @param {string} slug - Jetpack Cloud resource slug.
 * @returns {string} The valid Jetpack Cloud URL
 */
export function getJetpackCloudUrl( state, slug ) {
	return `https://cloud.jetpack.com/${ slug }/${ getSiteRawUrl( state ) }`;
}

/**
 * Returns if the new Stats experience is enabled.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if the new Stats experience is enabled.
 */
export function isOdysseyStatsEnabled( state ) {
	return !! state.jetpack.initialState.isOdysseyStatsEnabled;
}

/**
 * Returns true if Blaze can be used on the site.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if Blaze is available on the site.
 */
export function shouldInitializeBlaze( state ) {
	return !! state.jetpack.initialState.shouldInitializeBlaze;
}

/**
 * Returns true if the wp-admin Blaze dashboard is enabled.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if the Blaze dashboard is enabled.
 */
export function isBlazeDashboardEnabled( state ) {
	return !! state.jetpack.initialState.isBlazeDashboardEnabled;
}

/**
 * Returns information about the Gutenberg plugin and its Interactivity API support.
 *
 * @param {object} state - Global state tree.
 * @returns {object} Gutenberg plugin information.
 */
export function getGutenbergState( state ) {
	return state.jetpack.initialState.gutenbergInitialState;
}

/**
 * Check if the Sharing block is available on the site.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if the Sharing block is available on the site.
 */
export function isSharingBlockAvailable( state ) {
	return !! state.jetpack.initialState.siteData.isSharingBlockAvailable;
}

/**
 * Get the Jetpack Manage info
 *
 * @param {object} state - Global state tree.
 * @returns {object} Jetpack Manage info
 */
export function getJetpackManageInfo( state ) {
	return state.jetpack.initialState.jetpackManage;
}

/**
 * Returns true if Subscription Site feature is enabled on the site.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if Subscription Site feature is enabled on the site.
 */
export function isSubscriptionSiteEnabled( state ) {
	return !! state.jetpack.initialState.isSubscriptionSiteEnabled;
}

/**
 * Returns true if Subscription Site editing feature is supported.
 *
 * @param {object} state - Global state tree.
 * @returns {boolean} True if Subscription Site editing feature is supported.
 */
export function subscriptionSiteEditSupported( state ) {
	return !! state.jetpack.initialState.subscriptionSiteEditSupported;
}

/**
 * Get the Jetpack Social Initial State
 *
 * @param {object} state - Global state tree.
 * @returns {object} Jetpack Social Initial State
 */
export function getSocialInitiaState( state ) {
	return state.jetpack.initialState.socialInitialState ?? {};
}
