import { GoldenTokenModal } from '@automattic/jetpack-licensing';
import { __ } from '@wordpress/i18n';
import useSitePurchases from '../../data/use-site-purchases';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { includesLifetimePurchase } from '../../utils/is-lifetime-purchase';
import type { FC } from 'react';

const RedeemTokenScreen: FC = () => {
	const { userConnectionData } = useMyJetpackConnection();
	// They might not have a display name set in wpcom, so fall back to wpcom login or local username.
	const displayName =
		userConnectionData?.currentUser?.wpcomUser?.display_name ||
		userConnectionData?.currentUser?.wpcomUser?.login ||
		userConnectionData?.currentUser?.username;
	const { isLoading, data: purchases } = useSitePurchases();

	if ( isLoading ) {
		return <>{ __( 'Checking gold status…', 'jetpack-my-jetpack' ) }</>;
	}

	const tokenRedeemed = includesLifetimePurchase( purchases );

	return (
		<>
			<GoldenTokenModal tokenRedeemed={ tokenRedeemed } displayName={ displayName } />
		</>
	);
};

export default RedeemTokenScreen;
