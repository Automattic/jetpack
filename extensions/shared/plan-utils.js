/**
 * External dependencies
 */
import { compact, get, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { isSimpleSite } from './site-type-utils';
import getJetpackExtensionAvailability from './get-jetpack-extension-availability';
import getJetpackData from './get-jetpack-data';
import getSiteFragment from './get-site-fragment';
import { requiresPaidPlan } from './register-jetpack-block';

/**
 * WP.com plan objects have a dedicated `path_slug` field,
 * Jetpack plan objects don't.
 * For Jetpack, we thus use the plan slug with the 'jetpack_' prefix removed.
 *
 * @param {object} PlanData -          Plan data object.
 * @param {string} PlanData.planSlug - Plan slug.
 * @param {object} PlanData.plan -     Object with details about the plan.
 * @returns {string}                   Plan path slug.
 */
export function getPlanPathSlug( { planSlug, plan } ) {
	return startsWith( planSlug, 'jetpack_' )
		? planSlug.substr( 'jetpack_'.length )
		: get( plan, [ 'path_slug' ] );
}

/**
 * Return the checkout URL to upgrade the site plan,
 * depending on the plan, postId, and postType site values.
 *
 * @param {object} siteParams -          Site params used to build the URL.
 * @param {string} siteParams.planSlug - Plan slug.
 * @param {string} siteParams.plan -     An object with details about the plan.
 * @param {number} siteParams.postId -   Post id.
 * @param {string} siteParams.postType - Post type.
 * @returns {string}                     Upgrade URL.
 */
export function getUpgradeUrl( { planSlug, plan, postId, postType } ) {
	const planPathSlug = getPlanPathSlug( { planSlug, plan } );

	// The editor for CPTs has an `edit/` route fragment prefixed
	const postTypeEditorRoutePrefix = [ 'page', 'post' ].includes( postType ) ? '' : 'edit';

	// Post-checkout: redirect back here
	const redirectTo = isSimpleSite()
		? addQueryArgs(
				'/' +
					compact( [ postTypeEditorRoutePrefix, postType, getSiteFragment(), postId ] ).join( '/' ),
				{
					plan_upgraded: 1,
				}
		  )
		: addQueryArgs(
				window.location.protocol +
					`//${ getSiteFragment().replace( '::', '/' ) }/wp-admin/post.php`,
				{
					action: 'edit',
					post: postId,
					plan_upgraded: 1,
				}
		  );

	return (
		planPathSlug &&
		addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
			redirect_to: redirectTo,
		} )
	);
}

/**
 * Check if the block should is upgradable.
 *
 * @param {string} name - Block name.
 * @returns {boolean} True if it should show the nudge. Otherwise, False.
 */
export function isUpgradable( name ) {
	if ( ! name ) {
		return false;
	}

	// Hardcoding/temporary solution for core/cover block.
	if ( isSimpleSite() && name === 'core/video' ) {
		return true;
	}

	const [ , blockName ] = /\//.test( name ) ? name.split( '/' ) : [ null, name ];
	const { details, unavailableReason } = getJetpackExtensionAvailability( blockName );
	return isSimpleSite() && requiresPaidPlan( unavailableReason, details );
}

/**
 * Return whether upgrade nudges are enabled or not
 *
 * @returns {boolean}
 */
export function isUpgradeNudgeEnabled() {
	return get( getJetpackData(), 'jetpack.enable_upgrade_nudge', false );
}
