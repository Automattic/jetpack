import useConnection from '@automattic/jetpack-connection/use-connection';
import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
// The subpath import above skips the package's global type declarations, which its own sources rely on.
import type {} from '@automattic/jetpack-connection';

/**
 * Whether the page can call WordPress.com as the current user, and how to connect when it can't.
 *
 * Simple sites are on WordPress.com already, so they never need a Jetpack connection.
 *
 * @return The connection state.
 */
export default function useWpcomConnection() {
	const adminUrl = getSiteData()?.admin_url;
	const {
		isRegistered,
		hasConnectedOwner,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		handleRegisterSite,
	} = useConnection( {
		from: 'jetpack-monetize',
		redirectUri: adminUrl ? `${ adminUrl }admin.php?page=jetpack-monetize` : undefined,
	} );

	return {
		canUseWpcom: isSimpleSite() || Boolean( isRegistered && hasConnectedOwner && isUserConnected ),
		// Registers the site first if needed, then connects the user.
		connect: handleRegisterSite,
		isConnecting: Boolean( siteIsRegistering || userIsConnecting ),
	};
}
