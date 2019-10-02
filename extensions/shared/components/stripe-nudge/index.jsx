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
		title={ __( 'Connect to Stripe to use this block on your site', 'jetpack' ) }
		subtitle={ __(
			'This block will be hidden from your visitors until you connect to Stripe.',
			'jetpack'
		) }
	/>
);
