/* global myJetpackInitialState */
/* global myJetpackRest */
import { useConnection } from '@automattic/jetpack-connection';

/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */
export default function useMyJetpackConnection() {
	const { apiRoot, apiNonce } = myJetpackRest;
	const { topJetpackMenuItemUrl } = myJetpackInitialState;
	const connectionData = useConnection( { apiRoot, apiNonce } );

	// Alias: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;

	return {
		apiNonce,
		apiRoot,
		...connectionData,
		isSiteConnected,
		topJetpackMenuItemUrl,
	};
}
