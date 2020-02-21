/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { compact, get, startsWith } from 'lodash';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import BlockNudge from '../block-nudge';
import getSiteFragment from '../../get-site-fragment';
import { isSimpleSite } from '../../site-type-utils';
import './store';

import './style.scss';

const getTitle = ( customTitle, planName ) => {
	if ( customTitle ) {
		return planName ? sprintf( customTitle.knownPlan, { planName } ) : customTitle.unknownPlan;
	}

	return planName
		? sprintf( __( 'Upgrade to %(planName)s to use this block on your site.', 'jetpack' ), {
				planName,
		  } )
		: __( 'Upgrade to a paid plan to use this block on your site.', 'jetpack' );
};

export const UpgradeNudge = ( {
	planName,
	trackViewEvent,
	trackClickEvent,
	upgradeUrl,
	title,
	subtitle,
} ) => {
	useEffect( () => {
		if ( planName ) {
			trackViewEvent();
		}
	}, [ planName ] );

	return (
		<BlockNudge
			buttonLabel={ __( 'Upgrade', 'jetpack' ) }
			icon={
				<GridiconStar
					className="jetpack-upgrade-nudge__icon"
					size={ 18 }
					aria-hidden="true"
					role="img"
					focusable="false"
				/>
			}
			href={ upgradeUrl }
			onClick={ trackClickEvent }
			title={ getTitle( title, planName ) }
			subtitle={
				subtitle
					? subtitle
					: __(
							'You can try it out before upgrading, but only you will see it. It will be hidden from your visitors until you upgrade.',
							'jetpack'
					  )
			}
		/>
	);
};

export default compose( [
	withSelect( ( select, { plan: planSlug, blockName } ) => {
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

		const upgradeUrl =
			planPathSlug &&
			addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
				redirect_to,
			} );

		const planName = get( plan, [ 'product_name' ] );
		return {
			trackViewEvent: () =>
				void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_nudge_impression', {
					plan: planPathSlug,
					block: blockName,
				} ),
			trackClickEvent: () =>
				void analytics.tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
					plan: planPathSlug,
					block: blockName,
				} ),
			planName,
			upgradeUrl,
		};
	} ),
] )( UpgradeNudge );
