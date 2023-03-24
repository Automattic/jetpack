import { useConnection } from '@automattic/jetpack-connection';
import React, { useCallback } from 'react';
import usePurchases from '../../hooks/use-purchases';
import GoldenTokenModal from '../golden-token';

/**
 * The RedeemToken component of the My Jetpack app.
 *
 * @returns {object} The RedeemTokenScreen component.
 */
export default function RedeemTokenScreen() {
	const onModalClose = useCallback( event => {
		if ( document.referrer.includes( window.location.host ) ) {
			// Prevent default here to minimize page change within the My Jetpack app.
			event.preventDefault();
			history.back();
		} else {
			// If noreferrer, redirect to the My Jetpack dashboard.
			event.preventDefault();
			window.location.href = window?.myJetpackInitialState?.myJetpackUrl;
		}
	}, [] );

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
