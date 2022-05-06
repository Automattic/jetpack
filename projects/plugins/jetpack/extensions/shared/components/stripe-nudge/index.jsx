/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import BlockNudge from '../block-nudge';
import { store as membershipProductsStore } from '../../../store/membership-products';

import './style.scss';

export const StripeNudge = ( { blockName } ) => {
	const store = select( membershipProductsStore );
	const stripeConnectUrl = store.getConnectUrl();

	const recordTracksEvent = () =>
		analytics.tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
			block: blockName,
		} );

	if ( store.getShouldUpgrade() || ! stripeConnectUrl ) {
		return null;
	}

	return (
		<BlockNudge
			className="jetpack-stripe-nudge__banner"
			buttonLabel={ __( 'Connect', 'jetpack' ) }
			icon={
				<GridiconStar
					className="jetpack-stripe-nudge__icon"
					size={ 18 }
					aria-hidden="true"
					role="img"
					focusable="false"
				/>
			}
			href={ stripeConnectUrl }
			onClick={ recordTracksEvent }
			title={ __( 'Connect to Stripe to use this block on your site', 'jetpack' ) }
			subtitle={ __(
				'This block will be hidden from your visitors until you connect to Stripe.',
				'jetpack'
			) }
		/>
	);
};
