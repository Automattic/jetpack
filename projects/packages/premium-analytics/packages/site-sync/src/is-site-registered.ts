/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { select } from '@wordpress/data';

/**
 * Whether the site is registered (has a Jetpack blog token).
 *
 * Prefers the live `jetpack-connection` store, falling back to the script-data
 * snapshot when it isn't present. Read by store id rather than importing
 * `@automattic/jetpack-connection` to keep that package's component/stylesheet
 * graph out of route bundles.
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
