/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import BlockNudge from '../block-nudge';
import getConnectUrl from '../../get-connect-url';

import './style.scss';

export const StripeNudge = ( { blockName, url } ) => (
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
		href={ url }
		onClick={ () =>
			void analytics.tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
				block: blockName,
			} )
		}
		title={ __( 'Connect to Stripe to use this block on your site', 'jetpack' ) }
		subtitle={ __(
			'This block will be hidden from your visitors until you connect to Stripe.',
			'jetpack'
		) }
	/>
);

export default ( { blockName, postId, stripeConnectUrl } ) => {
	const url = getConnectUrl( postId, stripeConnectUrl );
	if ( ! url ) {
		return null;
	}

	return <StripeNudge blockName={ blockName } url={ url } />;
};
