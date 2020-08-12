/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';
import { __, sprintf } from '@wordpress/i18n';
import { get, startsWith } from 'lodash';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import BlockNudge from '../block-nudge';
import { getUpgradeUrl } from '../../../shared/plan-utils';

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

/**
 * Return the nudge description translated to the user language, or Null.
 * `subtitle` param accepts three types:
 * - A string, in which case it will translate and returned.
 * - False (boolean), in which case it will return false
 * - Undefined: it will return the default nudge description.
 *
 * @param {string|boolean} subtitle - Subtitle to translate, or False.
 * @returns {string|null} Nudge description, or Null.
 */
const getSubtitle = subtitle => {
	if ( subtitle === false ) {
		return null;
	}

	if ( ! subtitle ) {
		return __(
			'You can try it out before upgrading, but only you will see it. It will be hidden from your visitors until you upgrade.',
			'jetpack'
		);
	}

	return subtitle;
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
			subtitle={ getSubtitle( subtitle ) }
		/>
	);
};

export default compose( [
	withSelect( ( select, { plan: planSlug, blockName } ) => {
		const plan = select( 'wordpress-com/plans' ).getPlan( planSlug );
		const postId = select( 'core/editor' ).getCurrentPostId();
		const postType = select( 'core/editor' ).getCurrentPostType();

		const upgradeUrl = getUpgradeUrl( { plan, planSlug, postId, postType } );

		// WP.com plan objects have a dedicated `path_slug` field, Jetpack plan objects don't
		// For Jetpack, we thus use the plan slug with the 'jetpack_' prefix removed.
		const planPathSlug = startsWith( planSlug, 'jetpack_' )
			? planSlug.substr( 'jetpack_'.length )
			: get( plan, [ 'path_slug' ] );

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
