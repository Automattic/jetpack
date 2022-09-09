import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { compact, get, startsWith, map, filter, head } from 'lodash';
import getJetpackData from './get-jetpack-data';
import getJetpackExtensionAvailability from './get-jetpack-extension-availability';
import getSiteFragment from './get-site-fragment';
import { isAtomicSite, isSimpleSite } from './site-type-utils';

/**
 * Return the checkout URL to upgrade the site plan,
 * depending on the plan, postId, and postType site values.
 *
 * @param {object} siteParams -          Site params used to build the URL.
 * @param {string} siteParams.planSlug - Plan slug.
 * @param {object} siteParams.plan -     An object with details about the plan.
 * @param {number} siteParams.postId -   Post id.
 * @param {string} siteParams.postType - Post type.
 * @returns {string}                     Upgrade URL.
 */
export function getUpgradeUrl( { planSlug, plan, postId, postType } ) {
	// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't.
	const planPathSlug = startsWith( planSlug, 'jetpack_' ) ? planSlug : get( plan, [ 'path_slug' ] );

	// The full site editor has no set post type.
	const redirect_to = ( undefined === postType
		? () => {
				const queryParams = new URLSearchParams( window.location.search );

				return addQueryArgs(
					window.location.protocol +
						`//${ getSiteFragment().replace( '::', '/' ) }/wp-admin/site-editor.php`,
					{
						postId: queryParams.get( 'postId' ),
						postType: queryParams.get( 'postType' ),
						plan_upgraded: 1,
					}
				);
		  }
		: () => {
				// The editor for CPTs has an `edit/` route fragment prefixed.
				const postTypeEditorRoutePrefix = [ 'page', 'post' ].includes( postType ) ? '' : 'edit';

				// Post-checkout: redirect back here.
				return isSimpleSite()
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
		  } )();

	// Redirect to calypso plans page for WoC sites.
	if ( isAtomicSite() ) {
		return addQueryArgs( `https://wordpress.com/plans/${ getSiteFragment() }`, {
			redirect_to,
			customerType: 'business',
		} );
	}

	return (
		planPathSlug &&
		addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
			redirect_to,
		} )
	);
}

/**
 * Check if the block is upgradable, based on whether
 * the block requires a paid plan.
 *
 * @param {string} name - Block name.
 * @returns {boolean} True if the block is upgradable, false otherwise.
 */
export function isUpgradable( name ) {
	if ( ! name ) {
		return false;
	}

	const blockName = /^jetpack\//.test( name ) ? name.substr( 8, name.length ) : name;
	const { available, unavailableReason } = getJetpackExtensionAvailability( blockName );

	return ! available && 'missing_plan' === unavailableReason;
}

/**
 * Checks whether the block requires a paid plan or not.
 *
 * @param {string} unavailableReason - The reason why block is unavailable
 * @param {object} details - The block details
 * @returns {string|boolean} Either false if the block doesn't require a paid plan, or the actual plan name it requires.
 */
export function requiresPaidPlan( unavailableReason, details ) {
	if ( unavailableReason === 'missing_plan' ) {
		return details.required_plan;
	}
	return false;
}

/**
 * Returns the required plan slug for a passed block name.
 *
 * @param {string} name - Block name.
 * @returns {string|boolean} Plan name if the block is upgradable, false otherwise.
 */
export function getRequiredPlan( name ) {
	if ( ! name ) {
		return false;
	}

	const blockName = /^jetpack\//.test( name ) ? name.substr( 8, name.length ) : name;
	const { details, unavailableReason } = getJetpackExtensionAvailability( blockName );

	return requiresPaidPlan( unavailableReason, details );
}

/*
 * Usable blocks list with a free plan.
 * This array contains blocks that can be usable
 * even with a free plan, as well as properties
 * used to handle specific behaviour.
 */
const usableBlockWithFreePlan = [
	{
		name: 'core/cover',
		mediaPlaceholder: true,
		mediaReplaceFlow: true,
		fileType: 'video',
		description: __( 'Upgrade your plan to use video covers', 'jetpack' ),
	},
	{
		name: 'core/audio',
		mediaPlaceholder: true,
		mediaReplaceFlow: true,
		fileType: 'audio',
		description: __( 'Upgrade your plan to upload audio', 'jetpack' ),
	},
];

/**
 * Return whether upgrade nudges are enabled or not.
 *
 * @returns {boolean} True if the Upgrade Nudge is enable. Otherwise, False.
 */
export function isUpgradeNudgeEnabled() {
	return get( getJetpackData(), 'jetpack.enable_upgrade_nudge', false );
}

/*
 * Some blocks are still usable with a free plan.
 * We can handle their dual behavior defining specifically
 * when to show the upgrade banner
 * through or the Paid Block context.
 *
 * @param {string} name - Block name to check.
 * @returns {boolean} True is the block is usable with a Free plan. Otherwise, False.
 */
export const isStillUsableWithFreePlan = name =>
	map( usableBlockWithFreePlan, 'name' ).includes( name );

export const getUsableBlockProps = blockName =>
	head( filter( usableBlockWithFreePlan, ( { name } ) => name === blockName ) );
