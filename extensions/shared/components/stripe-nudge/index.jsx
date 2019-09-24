/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import BlockNudge from '../block-nudge';

import './style.scss';

export default ( { stripeConnectUrl } ) => (
	<BlockNudge
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
		onClick={ blockName =>
			void analytics.tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
				block: blockName,
			} )
		}
		title={ __( 'To use this block, connect to Stripe.', 'jetpack' ) }
		subtitle={ __(
			'Check if Stripe is available in your country, and sign up for an account.',
			'jetpack'
		) }
	/>
);
