/* global myJetpackInitialState */
/* global myJetpackRest */
/**
 * WordPress dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';

/**
 * React custom hook to get the site purchases data.
 *
 * @returns {object} site purchases data
 */
export default function useMyJetpackConnection() {
	const { apiRoot, apiNonce, registrationNonce } = myJetpackRest;
	const { redirectUrl } = myJetpackInitialState;
	const connectionData = useConnection( { apiRoot, apiNonce } );

	// Alias: https://github.com/Automattic/jetpack/blob/master/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;

	return {
		apiNonce,
		apiRoot,
		registrationNonce,
		...connectionData,
		isSiteConnected,
		redirectUrl,
	};
}
