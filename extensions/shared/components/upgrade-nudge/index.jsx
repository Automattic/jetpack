/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@wordpress/components';
import { compact, get, startsWith } from 'lodash';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Warning } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import getSiteFragment from '../../get-site-fragment';
import './store';

import './style.scss';

export const UpgradeNudge = ( { autosaveAndRedirectToUpgrade, planName, upgradeUrl } ) => (
	<Warning
		actions={
			// Use upgradeUrl to determine whether or not to display the Upgrade button.
			// We tried setting autosaveAndRedirectToUpgrade to falsey in `withDispatch`,
			// but it doesn't seem to be reliably updated after a `withSelect` update.
			upgradeUrl && [
				<Button
					href={ upgradeUrl } // Only for server-side rendering, since onClick doesn't work there.
					onClick={ autosaveAndRedirectToUpgrade }
					target="_top"
					isDefault
				>
					{ __( 'Upgrade', 'jetpack' ) }
				</Button>,
			]
		}
		className="jetpack-upgrade-nudge"
	>
		<span className="jetpack-upgrade-nudge__info">
			<GridiconStar
				className="jetpack-upgrade-nudge__icon"
				size={ 18 }
				aria-hidden="true"
				role="img"
				focusable="false"
			/>
			<span className="jetpack-upgrade-nudge__text-container">
				<span className="jetpack-upgrade-nudge__title">
					{ planName
						? sprintf( __( 'Upgrade to %(planName)s to use this block on your site.', 'jetpack' ), {
								planName,
						  } )
						: __( 'Upgrade to a paid plan to use this block on your site.', 'jetpack' ) }
				</span>
				<span className="jetpack-upgrade-nudge__message">
					{ __(
						'You can try it out before upgrading, but only you will see it. It will be hidden from visitors until you upgrade.',
						'jetpack'
					) }
				</span>
			</span>
		</span>
	</Warning>
);

export default compose( [
	withSelect( ( select, { plan: planSlug } ) => {
		const plan = select( 'wordpress-com/plans' ).getPlan( planSlug );

		// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't
		// For Jetpack, we thus use the plan slug with the 'jetpack_' prefix removed.
		const planPathSlug = startsWith( planSlug, 'jetpack_' )
			? planSlug.substr( 'jetpack_'.length )
			: get( plan, [ 'path_slug' ] );

		const postId = select( 'core/editor' ).getCurrentPostId();
		const postType = select( 'core/editor' ).getCurrentPostType();

		// The editor for CPTs has an `edit/` route fragment prefixed
		const postTypeEditorRoutePrefix = [ 'page', 'post' ].includes( postType ) ? '' : 'edit';

		const isWpcom = get( window, [ '_currentSiteType' ] ) === 'simple';

		// Post-checkout: redirect back here
		const redirect_to = isWpcom
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

		const upgradeUrl =
			planPathSlug &&
			addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
				redirect_to,
			} );

		return {
			planName: get( plan, [ 'product_name' ] ),
			upgradeUrl,
		};
	} ),
	withDispatch( ( dispatch, { blockName, plan, upgradeUrl } ) => ( {
		autosaveAndRedirectToUpgrade: async event => {
			event.preventDefault(); // Don't follow the href before autosaving
			analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
				plan,
				block: blockName,
			} );
			await dispatch( 'core/editor' ).autosave();
			// Using window.top to escape from the editor iframe on WordPress.com
			window.top.location.href = upgradeUrl;
		},
	} ) ),
] )( UpgradeNudge );
