import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import usePurchases from '../../hooks/use-purchases';
import { includesLifetimePurchase } from '../../utils/is-lifetime-purchase';
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

	const { userConnectionData } = useConnection();
	// They might not have a display name set in wpcom, so fall back to wpcom login or local username.
	const displayName =
		userConnectionData?.currentUser?.wpcomUser?.display_name ||
		userConnectionData?.currentUser?.wpcomUser?.login ||
		userConnectionData?.currentUser?.username;
	const { isFetchingPurchases, purchases } = usePurchases();
	const tokenRedeemed = includesLifetimePurchase( purchases );

	if ( isFetchingPurchases ) {
		return <>{ __( 'Checking gold status…', 'jetpack-my-jetpack' ) }</>;
	}

	return (
		<>
			<GoldenTokenModal
				tokenRedeemed={ tokenRedeemed }
				displayName={ displayName }
				onModalClose={ onModalClose }
			/>
		</>
	);
}
