/**
 * External dependencies
 */
import GridiconStar from 'gridicons/dist/star';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg, isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import analytics from '../../../../_inc/client/lib/analytics';
import BlockNudge from '../block-nudge';

import './style.scss';

export const StripeNudge = ( {
	blockName,
	url
} ) => (
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
	if ( ! isURL( stripeConnectUrl ) ) {
		return null;
	}

	let url = stripeConnectUrl;

	if ( postId ) {
		try {
			const state = getQueryArg( stripeConnectUrl, 'state' );
			const decodedState = JSON.parse( atob( state ) );
			decodedState.from_editor_post_id = postId;
			url = addQueryArgs( stripeConnectUrl, { state: btoa( JSON.stringify( decodedState ) ) } );
		} catch ( err ) {
			if ( process.env.NODE_ENV !== 'production' ) {
				console.error( err ); // eslint-disable-line no-console
			}
		}
	}

	return (
		<StripeNudge blockName={ blockName } url={ url } />
	);
};
