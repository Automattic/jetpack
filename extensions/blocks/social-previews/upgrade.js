/**
 * External dependencies
 */
import { compact, get } from 'lodash';
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from '../../../_inc/client/lib/analytics';
import { isSimpleSite } from '../../shared/site-type-utils';
import getSiteFragment from '../../shared/get-site-fragment';
import upgradeImageUrl from './upgrade-illustration.svg';

const SocialPreviewsUpgrade = function SocialPreviewsUpgrade( {
	autosaveAndRedirect,
	href,
	trackViewEvent,
} ) {
	// Using the effect here so the tracking is only called once on component mount.
	useEffect( trackViewEvent, [] );

	return (
		<div className="jetpack-social-previews__modal-upgrade">
			<img
				className="jetpack-social-previews__upgrade-illustration"
				src={ upgradeImageUrl }
				width="351"
				height="264"
				alt="" // The image is decorative.
			/>
			<div className="jetpack-social-previews__upgrade-description">
				<h2 className="jetpack-social-previews__upgrade-heading">
					{ __( 'Upgrade to a Business Plan to unlock the power of our SEO tools', 'jetpack' ) }
				</h2>
				<ul className="jetpack-social-previews__upgrade-feature-list">
					<li>
						{ __(
							'Preview your site’s content as it will appear on Facebook, Twitter, and the WordPress.com Reader.',
							'jetpack'
						) }
					</li>
					<li>
						{ __(
							'Control how page titles will appear on Google search results and social networks.',
							'jetpack'
						) }
					</li>
					<li>
						{ __(
							'Customize your front page meta data to change how your site appears to search engines.',
							'jetpack'
						) }
					</li>
				</ul>

				<Button
					href={ href } // Only for server-side rendering, since onClick doesn't work there.
					isPrimary
					label={ __( 'Purchase a business plan to access social previews', 'jetpack' ) }
					onClick={ autosaveAndRedirect }
					target="_top"
				>
					{ __( 'Upgrade', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

export default compose( [
	withSelect( select => {
		const plan = select( 'wordpress-com/plans' ).getPlan( 'business-bundle' );
		const planPathSlug = get( plan, [ 'path_slug' ] );

		const postId = select( 'core/editor' ).getCurrentPostId();
		const postType = select( 'core/editor' ).getCurrentPostType();

		// The editor for CPTs has an `edit/` route fragment prefixed.
		const postTypeEditorRoutePrefix = [ 'page', 'post' ].includes( postType ) ? '' : 'edit';

		// Post-checkout: redirect back here.
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

		const href =
			planPathSlug &&
			addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
				redirect_to,
			} );

		return {
			href,
			trackViewEvent: () =>
				void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_nudge_impression', {
					plan: planPathSlug,
					block: 'social-previews',
				} ),
			trackClickEvent: () =>
				void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
					plan: planPathSlug,
					block: 'social-previews',
				} ),
		};
	} ),
	withDispatch( ( dispatch, { href, trackClickEvent } ) => ( {
		autosaveAndRedirect: async event => {
			event.preventDefault(); // Don't follow the href before auto-saving.

			trackClickEvent();
			await dispatch( 'core/editor' ).autosave();

			// Using window.top to escape from the editor iframe on WordPress.com.
			window.top.location.href = href;
		},
	} ) ),
] )( SocialPreviewsUpgrade );
