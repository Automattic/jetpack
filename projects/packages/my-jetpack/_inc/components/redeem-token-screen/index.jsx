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

	const onModalClose = useCallback(
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

	const { isFetchingPurchases, purchases } = usePurchases();
	const { userConnectionData } = useConnection();

	return (
		<GoldenTokenModal
			purchases={ purchases }
			fetchingPurchases={ isFetchingPurchases }
			userConnectionData={ userConnectionData }
			onModalClose={ onModalClose }
		/>
	);
}
