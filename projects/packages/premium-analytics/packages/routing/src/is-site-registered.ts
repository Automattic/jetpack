/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { select } from '@wordpress/data';

/**
 * Whether the site is registered (has a Jetpack blog token).
 *
 * Reads the live `jetpack-connection` store first — it is updated the moment
 * the site registers, so the connect → syncing transition reflects registration
 * without a full-page reload. Falls back to the server-injected script-data
 * snapshot when that store is not registered yet (e.g. a direct load of a route
 * whose components never import the connection package). On first load the two
 * agree (the store seeds from the same snapshot); the store only adds the live
 * post-registration value.
 *
 * The connection store is read by its string id rather than by importing the
 * `@automattic/jetpack-connection` package, so route bundles stay free of its
 * component/stylesheet graph.
 *
 * @return Whether the site is registered.
 */
export function isSiteRegistered(): boolean {
	const connectionStore = select( 'jetpack-connection' ) as
		| { getConnectionStatus?: () => { isRegistered?: boolean } }
		| undefined;

	if ( connectionStore?.getConnectionStatus ) {
		return Boolean( connectionStore.getConnectionStatus().isRegistered );
	}

	return Boolean( getScriptData()?.connection?.connectionStatus?.isRegistered );
}
