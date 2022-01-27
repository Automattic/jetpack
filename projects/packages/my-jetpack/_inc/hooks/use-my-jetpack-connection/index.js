/* global myJetpackInitialState */
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
	const { apiRoot, apiNonce } = myJetpackInitialState;
	return useConnection( { apiRoot, apiNonce } );
}
