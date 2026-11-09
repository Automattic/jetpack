import { CONNECTION_FROM } from '@automattic/jetpack-connection';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { isSimpleSite } from '@automattic/jetpack-script-data';

/**
 * Whether the page can call WordPress.com as the current user, and how to connect when it can't.
 *
 * Simple sites are on WordPress.com already, so they never need a Jetpack connection.
 *
 * @return The connection state.
 */
export default function useWpcomConnection() {
	const {
		isRegistered,
		hasConnectedOwner,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		handleRegisterSite,
	} = useConnection( {
		from: CONNECTION_FROM.jetpackMonetizeConnectionGate,
		// Relative to wp-admin: the connection REST API adds the admin URL.
		redirectUri: 'admin.php?page=jetpack-monetize',
	} );

	return {
		canUseWpcom: isSimpleSite() || Boolean( isRegistered && hasConnectedOwner && isUserConnected ),
		// Registers the site first if needed, then connects the user.
		connect: handleRegisterSite,
		isConnecting: Boolean( siteIsRegistering || userIsConnecting ),
	};
}
