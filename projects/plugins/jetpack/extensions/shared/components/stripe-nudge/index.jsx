import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isSimpleSite,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import GridiconStar from 'gridicons/dist/star';
import { store as membershipProductsStore } from '../../../store/membership-products';
import BlockNudge from '../block-nudge';

import './style.scss';

export const StripeNudge = ( { blockName } ) => {
	const store = select( membershipProductsStore );
	const stripeConnectUrl = store.getConnectUrl();
	const { tracks } = useAnalytics();
	const isWpcom = isAtomicSite() || isSimpleSite();

	const recordTracksEvent = () =>
		tracks.recordEvent( 'jetpack_editor_block_stripe_connect_click', {
			block: blockName,
		} );

	if ( ! stripeConnectUrl ) {
		return null;
	}

	let readMoreUrl;

	switch ( blockName ) {
		case 'payment-buttons':
			readMoreUrl = isWpcom
				? getRedirectUrl( 'wpcom-support-wordpress-editor-blocks-payments-block' )
				: getRedirectUrl( 'jetpack-support-jetpack-blocks-payments-block' );
			break;
		case 'donations':
			readMoreUrl = isWpcom
				? getRedirectUrl( 'wpcom-support-wordpress-editor-blocks-donations-block' )
				: getRedirectUrl( 'jetpack-support-jetpack-blocks-donations-block' );
			break;
		case 'premium-content':
			readMoreUrl = isWpcom
				? getRedirectUrl( 'wpcom-support-wordpress-editor-blocks-premium-content-block' )
				: getRedirectUrl( 'jetpack-support-jetpack-blocks-premium-content-block' );
			break;
		default:
			readMoreUrl = isWpcom
				? getRedirectUrl( 'wpcom-support-payments-button-block' )
				: getRedirectUrl( 'jetpack-support-jetpack-blocks-payments-block' );
			break;
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
			readMoreUrl={ readMoreUrl }
			onClick={ recordTracksEvent }
			title={ __( 'Connect to Stripe to use this block on your site', 'jetpack' ) }
			subtitle={ __(
				'This block will be hidden from your visitors until you connect to Stripe.',
				'jetpack'
			) }
		/>
	);
};
