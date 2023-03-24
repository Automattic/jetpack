import { useConnection } from '@automattic/jetpack-connection';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import usePurchases from '../../hooks/use-purchases';
import GoldenTokenModal from '../golden-token';

/**
 * The RedeemToken component of the My Jetpack app.
 *
 * @returns {object} The RedeemTokenScreen component.
 */
export default function RedeemTokenScreen() {
	const { recordEvent } = useAnalytics();

	const onClickGoBack = useCallback(
		event => {
			recordEvent( 'jetpack_myjetpack_redeem_token_back_link_click' );
			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				history.back();
			} else {
				// If noreferrer, redirect to the My Jetpack dashboard.
				event.preventDefault();
				window.location.href = window?.myJetpackInitialState?.myJetpackUrl;
			}
		},
		[ recordEvent ]
	);

	const purchases = usePurchases();
	// Any purchase with the partner_slug of 'goldenticket' is considered a golden token.
	const goldenToken = purchases.filter( golden => golden.partner_slug === 'goldenticket' );
	const hasGoldenToken = goldenToken.length > 0;
	const { userConnectionData } = useConnection();

	return (
		<GoldenTokenModal
			hasGoldenToken={ hasGoldenToken }
			userConnectionData={ userConnectionData }
			onClickGoBack={ onClickGoBack }
		/>
	);
}
