import { GoldenTokenModal } from '@automattic/jetpack-licensing';
import { __ } from '@wordpress/i18n';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { includesLifetimePurchase } from '../../utils/is-lifetime-purchase';

/**
 * The RedeemToken component of the My Jetpack app.
 *
 * @return {object} The RedeemTokenScreen component.
 */
export default function RedeemTokenScreen() {
	const { userConnectionData } = useMyJetpackConnection();
	// They might not have a display name set in wpcom, so fall back to wpcom login or local username.
	const displayName =
		userConnectionData?.currentUser?.wpcomUser?.display_name ||
		userConnectionData?.currentUser?.wpcomUser?.login ||
		userConnectionData?.currentUser?.username;
	const { isLoading, data: purchases } = useSimpleQuery( {
		name: QUERY_PURCHASES_KEY,
		query: {
			path: REST_API_SITE_PURCHASES_ENDPOINT,
		},
	} );

	const tokenRedeemed = includesLifetimePurchase( purchases );

	if ( isLoading ) {
		return <>{ __( 'Checking gold status…', 'jetpack-my-jetpack' ) }</>;
	}

	return (
		<>
			<GoldenTokenModal tokenRedeemed={ tokenRedeemed } displayName={ displayName } />
		</>
	);
}
