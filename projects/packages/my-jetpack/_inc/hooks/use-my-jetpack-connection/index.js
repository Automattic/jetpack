/* global myJetpackInitialState */
/* global myJetpackRest */
/**
 * WordPress dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';

/**
 * React custom hook to get the site purchases data.
 *
 * @param {object} args - Connection parameters
 * @param {string} args.from - Identifier of the source of the connection/purchase flow.
 * @returns {object} site purchases data
 */
export default function useMyJetpackConnection( { from } = {} ) {
	const { apiRoot, apiNonce } = myJetpackRest;
	const { topJetpackMenuItemUrl } = myJetpackInitialState;
	const connectionData = useConnection( { apiRoot, apiNonce, from } );

	// Alias: https://github.com/Automattic/jetpack/blob/master/projects/packages/connection/src/class-rest-connector.php/#L315
	const isSiteConnected = connectionData.isRegistered;

	return {
		apiNonce,
		apiRoot,
		...connectionData,
		isSiteConnected,
		redirectUrl: topJetpackMenuItemUrl,
	};
}
