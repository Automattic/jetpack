import { useConnection } from '@automattic/jetpack-connection';
import { GoldenTokenModal } from '@automattic/jetpack-licensing';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useAvailableGoldenTokens from '../../hooks/use-available-golden-tokens';
import usePurchases from '../../hooks/use-purchases';
import { includesLifetimePurchase } from '../../utils/is-lifetime-purchase';

/**
 * The RedeemToken component of the My Jetpack app.
 *
 * @returns {object} The RedeemTokenScreen component.
 */
export default function RedeemTokenScreen() {
	const { userConnectionData } = useConnection();
	// They might not have a display name set in wpcom, so fall back to wpcom login or local username.
	const displayName =
		userConnectionData?.currentUser?.wpcomUser?.display_name ||
		userConnectionData?.currentUser?.wpcomUser?.login ||
		userConnectionData?.currentUser?.username;

	const { isFetchingPurchases, purchases } = usePurchases();
	const tokenRedeemed = includesLifetimePurchase( purchases );
	const { availableGoldenTokens, isFetchingAvailableGoldenTokens } = useAvailableGoldenTokens();

	if ( isFetchingPurchases || isFetchingAvailableGoldenTokens ) {
		return <>{ __( 'Checking gold status…', 'jetpack-my-jetpack' ) }</>;
	}

	if ( availableGoldenTokens.length === 0 ) {
		return (
			<>{ __( 'Sorry. No Gold status for you. Try blogging harder.', 'jetpack-my-jetpack' ) }</>
		);
	}

	return (
		<>
			<GoldenTokenModal tokenRedeemed={ tokenRedeemed } displayName={ displayName } />
		</>
	);
}
