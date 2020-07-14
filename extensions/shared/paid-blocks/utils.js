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
import { isSimpleSite } from '../site-type-utils';
import getJetpackExtensionAvailability from '../get-jetpack-extension-availability';
import getSiteFragment from "../get-site-fragment";

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
	// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't
	// For Jetpack, we thus use the plan slug with the 'jetpack_' prefix removed.
	const planPathSlug = startsWith( planSlug, 'jetpack_' )
		? planSlug.substr( 'jetpack_'.length )
		: get( plan, [ 'path_slug' ] );

	// The editor for CPTs has an `edit/` route fragment prefixed
	const postTypeEditorRoutePrefix = [ 'page', 'post' ].includes( postType ) ? '' : 'edit';

	// Post-checkout: redirect back here
	const redirect_to = isSimpleSite()
		? addQueryArgs(
			'/' +
			compact( [ postTypeEditorRoutePrefix, postType, getSiteFragment(), postId ] ).join(
				'/'
			),
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

	return planPathSlug &&
		addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
			redirect_to,
		} );
}

/**
 * Check if the cover block should show the upgrade nudge.
 *
 * @param {string} name - Block name.
 * @returns {boolean} True if it should show the nudge. Otherwise, False.
 */
export function isUpgradable( name ) {
	// Remove the namespace form the block name.
	const blockName = name.replace( /[a-zA-Z_-]+\//, '' );
	const { unavailableReason } = getJetpackExtensionAvailability( blockName );

	return (
		name &&
		isSimpleSite() &&
		[ 'missing_plan', 'unknown' ].includes( unavailableReason )
	);
}

