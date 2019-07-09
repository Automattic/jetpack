/**
 * External dependencies
 */
import { get, startsWith } from 'lodash';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Warning } from '@wordpress/editor';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import getSiteFragment from '../get-site-fragment';
import './store';

import './style.scss';

const getUpgradeUrl = ( { planPathSlug, postId, postType } ) =>
	addQueryArgs( `https://wordpress.com/checkout/${ getSiteFragment() }/${ planPathSlug }`, {
		redirect_to: `/${ postType }/${ getSiteFragment() }/${ postId }`,
	} );

const UpgradeNudge = ( { autosaveAndRedirectToUpgrade, planName } ) => (
	<Warning
		actions={ [
			<Button onClick={ autosaveAndRedirectToUpgrade } target="_top" isDefault>
				{ __( 'Upgrade', 'jetpack' ) }
			</Button>,
		] }
		className="jetpack-upgrade-nudge"
	>
		<div className="jetpack-upgrade-nudge__info">
			<Gridicon className="jetpack-upgrade-nudge__icon" icon="star" size={ 18 } />
			<div>
				<span className="jetpack-upgrade-nudge__title">
					{ sprintf( __( 'This block is available under the %(planName)s Plan.', 'jetpack' ), {
						planName,
					} ) }
				</span>
				<span className="jetpack-upgrade-nudge__message">
					{ __( 'It will be hidden from site visitors until you upgrade.', 'jetpack' ) }
				</span>
			</div>
		</div>
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

		return {
			planName: get( plan, [ 'product_name_short' ] ),
			planPathSlug,
			postId: select( 'core/editor' ).getCurrentPostId(),
			postType: select( 'core/editor' ).getCurrentPostType(),
		};
	} ),
	withDispatch( ( dispatch, { planPathSlug, postId, postType } ) => ( {
		autosaveAndRedirectToUpgrade: () => {
			dispatch( 'core/editor' ).autosave();
			window.location.href = getUpgradeUrl( { planPathSlug, postId, postType } );
		},
	} ) ),
] )( UpgradeNudge );
